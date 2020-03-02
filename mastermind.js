var data = {
    guess: [0, 0, 0],
    solution: [0, 0, 0],
    lock: [0, 0, 0],
    solutionlength: 3, //this is technically not required, but will save having to constantly run .length
    solutionceiling: 3, //the max value a solution integer can have
    solutionfloor: 0, //the min value a solution integer can have
    correctguess: 0, //currency
    errorguess: 0,
    solutionsolved: 0
};

window.onload = function() { //load some SOLUTION numbers at page load
    for (i = 0; i < this.data.solutionlength; i++) {
        this.data.solution[i] = this.returnRandomInteger(data.solutionfloor, data.solutionceiling);
        this.document.getElementById("sol" + i).innerHTML = this.data.solution[i];
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
            data.correctguess++;
            data.lock[i] = 1; //lock the number as solution is correct - will prevent generating more numbers until cleared
            _lockcount++; //if lockcount == data.solutionlength at the end of the method, it means all numbers have been solved
            document.getElementById("guess" + i).style.color = "#5cb85c";
        } 
        else if (data.guess[i] != data.solution[i] && data.lock[i] == 0){
            data.errorguess++;
            document.getElementById("guess" + i).style.color = "#d9534f";
        }
    }

    if (_lockcount == data.solutionlength) {
        data.solutionsolved++;
        generateSolution();
    }

    document.getElementById("correctguess").innerHTML = data.correctguess;
    document.getElementById("errorguess").innerHTML = data.errorguess;
    document.getElementById("solutionsolved").innerHTML = data.solutionsolved;

}

function generateSolution() { //used to create a new solution after solving the previous one
    for (i = 0; i < data.solutionlength; i++) {
        data.lock[i] = 0; //we need to clear the lock array! Very important, or can't create new locks
        data.solution[i] = returnRandomInteger(data.solutionfloor, data.solutionceiling);
        document.getElementById("sol" + i).innerHTML = data.solution[i];
        document.getElementById("guess" + i).style.color = "#0275d8"; //some visual feedback that a solution was reached
    }
}

function returnRandomInteger(min, max) { //returns a random integer, min & max included
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}