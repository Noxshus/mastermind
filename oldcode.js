//Code which has ungone large changes & it was easier to remove it

/*function guess() { //principle solution guessing function
    
    for (let i = 0; i < data.solution.length; i++) {
        if (data.lock[i] == 0)
        {
            data.guess[i] = returnRandomInteger(data.solutionFloor, data.solutionCeiling);
            document.getElementById("guess" + i).innerHTML = data.guess[i];
        }
    }

    if (compare() == true) { //solution was reached
        data.solutionSolved++; // NEEDS TO BE UPDATED *******************************
        updateTimeToSolve("tick"); //process time statistics because we still needed a tick to get here
        gainNodeProgress();
        if (data.solutionCeiling >= 9) {
            if (data.solution.length >= 10) {
                generateSolution("solved");
            }
            else {
                upgradeSolutionLength();
            }
        } 
        else {
            upgradeSolutionCeiling();
        }
        //generateSolution("solved");
    }
    else //solution not reached, generates error(s)
    {
        updateErrorsToSolve("tick"); //we only update errors-to-solve on a tick and not on a solution because otherwise we get one extra tick of errors
        updateTimeToSolve("tick");
        data.errorGuess++; // NEEDS TO BE UPDATED *******************************
    }

    document.getElementById("errorguess").innerHTML = data.errorGuess;
    document.getElementById("solvedsolution").innerHTML = data.solutionSolved;
}*/

/*function compare() //compare the solution & guess arrays, lock any matches, increment values, call for a new solution
{ 
    let _lockcount = 0;

    for (let i = 0; i < data.solution.length; i++) {
        if (data.guess[i] == data.solution[i]) {
            data.lock[i] = 1; //lock the number as solution is correct - will prevent generating more numbers until cleared
            _lockcount++; //if lockcount == data.solutionlength at the end of the method, it means all numbers have been solved
            document.getElementById("guess" + i).style.color = "#5cb85c";
        } 
        else if (data.guess[i] != data.solution[i] && data.lock[i] == 0){           
            document.getElementById("guess" + i).style.color = "#d9534f";
        }
    }

    if (_lockcount == data.solution.length) {
        return true; //solution solved!
    } 
    else {
        return false; //solution not solved
        
    }
}*/