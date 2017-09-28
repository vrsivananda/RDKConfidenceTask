function pest(dataObject){
	
	//Starting variables
	var currentIntensity = dataObject.starting_intensity || 0.7; //Starting intensity

	//Variables for Down/Up
	var downThreshold = dataObject.down_threshold || 3; // 3 Down
	var upThreshold = dataObject.up_threshold || 1; // 1 Up
	var upperIntensityLimit = dataObject.upper_intensity_limit || 1;
	var lowerIntensityLimit = dataObject.lower_intensity_limit || 0.000000001;

	//Variables for PEST
	var currentStepSize = dataObject.starting_step_size || 0.32; //Starting step size
	var minimumStepSize = dataObject.min_step_size || 0.01; //Smallest step size
	var maximumStepSize = dataObject.max_step_size || 0.32; //Largest step size

	//Initialize fixed Down/Up variables 
	//(Do not change unless you want to deviate from the normal PEST procedure)
	var correctStreakCounter = 0;
	var incorrectStreakCounter = 0;
	
	//Initialize fixed PEST variables  
	//(Do not change unless you want to deviate from the normal PEST procedure)
	var originalStepThreshold = 3; //If stepping in the same direction, double on which step (If 3, doubles on the 3rd step)
	var incrementedStepThreshold = originalStepThreshold + 1; //The threshold when a reversal follows a doubling of step size
	var currentStepThreshold = originalStepThreshold; //Global variable to hold the current step threshold
	var firstTrial = true;
	var firstStep = true;
	var previousStepDirection; //Global variable to hold the previous step direction 
	var currentStepDirection; //Global variable to hold the current step direction
	var stepStreakCounter = 0; //Counter for streaks of steps in the same direction
	var stepSizeJustDoubled = false;


	//----------------Staircasing Functions Begin------------------

	//Function to decide on the coherent direction
	this.staircase = function (lastTrialWasCorrect){
		
		console.log("-----------------------------");
		console.log("lastTrialWasCorrect: " + lastTrialWasCorrect);
		
		//Only run these if it is not the first trial
		if (!firstTrial){
			
			//Check if the subject responded correctly on the previous trial
			if (lastTrialWasCorrect == true){
				responseWasCorrect(); //This function will housekeep for 3Down/1Up and call the changeStepSizePEST function
			}
			else if (lastTrialWasCorrect == false){
				responseWasIncorrect(); //This function will housekeep for 3Down/1Up and call the changeStepSizePEST function
			}
			else{
				console.log("Error: lastTrialWasCorrect is neither true nor false!");
			}
			
			previousStepDirection = currentStepDirection; //Pass the current step direction to the previous step direction for use in the next trial
		}
		//Set firstTrial to be false since every subsequent trial won't be the first trial
		else{
			firstTrial = false;
		}//End of if(!firstTrial)
		
		console.log("currentIntensity in staircase() is " + currentIntensity);
		//Return the currentIntensity into the trial
		return currentIntensity; 
		
		console.log("-----------------------------");
		
	}//End of staircase

	//Function to carry out steps if the response in the previous trial was correct
	function responseWasCorrect(){
		
		//Set the incorrect streak counter to zero
		incorrectStreakCounter = 0;
		
		//Increment the streak counter for correct responses
		correctStreakCounter++;
		
		//If it reaches the down threshold, then determine the step size and reset streak counter to zero.
		if(correctStreakCounter == downThreshold){
			
			//Set the current step direction for the staircase
			currentStepDirection = "down"; 
			
			//Use the PEST procedure to determine the step size
			changeStepSizePEST();
			
			//Decrease the intensity by the step size
			decreaseIntensity();
			
			//Reset the correct streak counter
			correctStreakCounter = 0;
		}
		
	}//End of responseWasCorrect

	//Function to carry out steps if the response in the previous trial was incorrect
	function responseWasIncorrect(){
		
		//Set the correct streak counter to zero
		correctStreakCounter = 0;
		
		//Increment the streak counter for incorrect responses
		incorrectStreakCounter++;
		
		//If it reaches the up threshold, then determine the step size, change the intensity level, and reset streak counter to zero.
		if(incorrectStreakCounter == upThreshold) {
			
			//Set the current step direction for the staircase
			currentStepDirection = "up"; 
			
			//Use the PEST procedure to determine the step size
			changeStepSizePEST();
			
			//Increase the intensity by the step size
			increaseIntensity();
			
			//Reset the incorrect streak counter
			incorrectStreakCounter = 0;
		}
		
	}//End of responseWasIncorrect

	//Function to change the stimuli step size according to PEST
	function changeStepSizePEST(){
		
		//Variable to store if this step is a reversal of the previous step
		var reversal;
		
		//For the first step, just set the reversal to false
		if (firstStep){
			reversal = false;
			//Change firstStep to be false because subsequent steps will have a previousStepDirection to compare it to
			firstStep = false;
		}
		//Else, set the reversal to whether the previous step direction corresponsds to the current step direction
		else{
			reversal = (previousStepDirection == currentStepDirection) ? false : true;
		}
		
		console.log("Reversal: " + reversal);
		
		//If current step is a reversal of the previous step
		if(reversal){
			
			//Reset the streak counter to include this step (therefore it is 1 instead of zero)
			stepStreakCounter = 1;
			
			//If the reversal did not follow a double in step size, then the threshold should be 3
			if (!stepSizeJustDoubled){
				currentStepThreshold = 3;
			}
			//If the step size just doubled in the previous step, increase the step threshold to 4 [Rule 4]
			else{
				currentStepThreshold = 4;
			}
			
			//Half the step size everytime it reverses [Rule 1]
			halveStepSize();
			console.log("Step size halved.");
			
			//Step size did not double, so we reset it back to false (this variable is used below in the else statement)
			stepSizeJustDoubled = false;
		}
		//If step was not a reversal (went in the same direction)
		else{
			
			//Increment the streak counter
			stepStreakCounter++;
			
			//If the streak has hit the streak threshold, then increase the step size by 2 [Rule 3]
			if (stepStreakCounter >= currentStepThreshold){
				doubleStepSize();
				stepSizeJustDoubled = true;
				console.log("Step size doubled.");
			}
			//Else step size did not double
			else{
				stepSizeJustDoubled = false;
				console.log("Step size remained the same because not hit threshold yet")
			}
			
			//If we go in the same direction, we stay with the same step size [Rule 2]
			//Unless we go 3 steps in the same direction, in which case we implement Rule 3 above
			
		}//End of else (not reversal)
		
		console.log("New step size = " + currentStepSize);
		
	}//End of changeStepSizePEST

	//Function to make sure that the intensity is still in range
	function intensityInRange(theintensity){
		return ((theintensity <= upperIntensityLimit) && (theintensity >= lowerIntensityLimit));
	}

	//Function that halves the step size
	function halveStepSize(){
		//Check to make sure that it is above the minimum
		if(currentStepSize * 0.5 > minimumStepSize){
			currentStepSize *= 0.5;
		}
		//If not, then set it to the minimum
		else{
			currentStepSize = minimumStepSize;
		}
	}//End of halveStepSize

	//Function that doubles the step size
	function doubleStepSize(){
		//Check to make sure that it is above the minimum
		if(currentStepSize*2 < maximumStepSize){
			currentStepSize *= 2;
		}
		//If not, then set it to the maximum
		else{
			currentStepSize = maximumStepSize;
		}
	}//End of doubleStepSize

	//Function to decrease the intensity by the step size
	function decreaseIntensity(){
		//Check that it will still be in the range after decrease
		if(intensityInRange(currentIntensity - currentStepSize)){
			currentIntensity -= currentStepSize;
		}
		//Else just set it to the minimum intensity allowed
		else{
			currentIntensity = lowerIntensityLimit;
		}
	}//End of decreaseIntensity

	//Function to decrease the intensity by the step size
	function increaseIntensity(){
		//Check that it will still be in the range after increase
		if(intensityInRange(currentIntensity + currentStepSize)){
			currentIntensity += currentStepSize;
		}
		//Else just set it to the minimum intensity allowed
		else{
			currentIntensity = upperIntensityLimit;
		}
	}//End of decreaseIntensity

	//----------------Staircasing Functions End------------------
}