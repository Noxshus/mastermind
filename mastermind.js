var data = {
    guess: [0, 0, 0],
    solution: [0, 0, 0],
    lock: [0, 0, 0],
    solutionlength: 3, //this is technically not required, but will save having to constantly run .length
    solutionceiling: 3, //the max value a solution integer can have
    solutionfloor: 0, //the min value a solution integer can have
    errorguess: 0,
    solutionsolved: 0
};

window.onload = function() {
    for (i = 0; i < this.data.solutionlength; i++) { //load some SOLUTION numbers at page load
        this.data.solution[i] = this.returnRandomInteger(data.solutionfloor, data.solutionceiling);
        this.document.getElementById("sol" + i).innerHTML = this.data.solution[i];
    }

    document.getElementById("guessbuttondisable").disabled = true; //sometimes, on refresh, disabled button isn't disabled by default for some reason
}

var updateLoop = setInterval(update, 1000); //seperate to everything else, we run checks to see if stuff needs to be unlocked. Seperated from the guessLoop so that we don't spam checks needlessly

function update() {
    if (data.solutionsolved >= 10) //reveal solution length button after solving 10 codes
    {
        document.getElementById("solutionlengthbutton").style.display = "inline";
    }
}

function guessLoop() { //begin the guess loop
    guessLoopGlobal = setInterval(guess, 1000);
    document.getElementById("guessbutton").disabled = true;
    document.getElementById("guessbuttondisable").disabled = false;
}

function guessLoopDisable() { //disable the loop
    clearInterval(guessLoopGlobal);
    document.getElementById("guessbutton").disabled = false;
    document.getElementById("guessbuttondisable").disabled = true;
}

function guess() { //principle solution guessing function
    for (i = 0; i < data.solutionlength; i++) {
        if (data.lock[i] == 0)
        {
            data.guess[i] = returnRandomInteger(data.solutionfloor, data.solutionceiling);
            document.getElementById("guess" + i).innerHTML = data.guess[i];
        }
    }

    compare();
}

function compare() { //compare the solution & guess arrays, lock any matches
    var _lockcount = 0;

    for (i = 0; i < data.solutionlength; i++) {
        if (data.guess[i] == data.solution[i]) {
            data.lock[i] = 1; //lock the number as solution is correct - will prevent generating more numbers until cleared
            _lockcount++; //if lockcount == data.solutionlength at the end of the method, it means all numbers have been solved
            document.getElementById("guess" + i).style.color = "#5cb85c";
        } 
        else if (data.guess[i] != data.solution[i] && data.lock[i] == 0){           
            document.getElementById("guess" + i).style.color = "#d9534f";
        }
    }

    if (_lockcount == data.solutionlength) {
        data.solutionsolved++;
        generateSolution();
    } 
    else {
        data.errorguess++;
    }

    document.getElementById("errorguess").innerHTML = data.errorguess;
    document.getElementById("solvedsolution").innerHTML = data.solutionsolved;

}

function generateSolution() { //used to create a new solution after solving the previous one
    for (i = 0; i < data.solutionlength; i++) {
        data.lock[i] = 0; //we need to clear the lock array! Very important, or can't create new locks
        data.solution[i] = returnRandomInteger(data.solutionfloor, data.solutionceiling);
        document.getElementById("sol" + i).innerHTML = data.solution[i];
        document.getElementById("guess" + i).style.color = "#0275d8"; //some visual feedback that a solution was reached
    }
}

function upgradeSolutionLength()
{
    if (data.solutionsolved >= 10) {
        data.solutionsolved = data.solutionsolved - 10;
        data.solutionlength++;
        data.solution.push(0);
        data.guess.push(0);
        data.lock.push(0);
        var newSolutionElement = document.createElement("span");
        newSolutionElement.id = "sol" + (data.solutionlength - 1);
        newSolutionElement.innerHTML = 0;
        document.getElementById("solutiondiv").appendChild(newSolutionElement);
        var newGuessElement = document.createElement("span");
        newGuessElement.id = "guess" + (data.solutionlength - 1);
        newGuessElement.innerHTML = 0;
        document.getElementById("guessdiv").appendChild(newGuessElement);
    }    
}

function devAddSolution()
{
    data.solutionsolved = data.solutionsolved + 10;
}

function returnRandomInteger(min, max) { //returns a random integer, min & max included
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}