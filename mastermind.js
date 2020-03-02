var data = {
    guess: [0, 0, 0],
    solution: [0, 0, 0],
    lock: [0, 0, 0],
    solutionlength: 3, //number of integers in the solution
    solutionceiling: 3, //the max value a solution integer can have
    solutionfloor: 0, //the min value a solution integer can have
    correctguess: 0,
    errorguess: 0
};

window.onload = function() { //load some SOLUTION numbers at page load
    for (i = 0; i < this.data.solution.length; i++) {
        this.data.solution[i] = this.returnRandomInteger(data.solutionfloor, data.solutionceiling);
        this.document.getElementById("sol" + i).innerHTML = this.data.solution[i];
    }
}

function guess() {
    for (i = 0; i < data.guess.length; i++) {
        if (data.lock[i] == 0)
        {
            data.guess[i] = returnRandomInteger(data.solutionfloor, data.solutionceiling);
            document.getElementById("guess" + i).innerHTML = data.guess[i];
        }
    }

    compare();
}

function compare() { //compare the solution & guess arrays
    for (i = 0; i < data.solution.length; i++) {
        if (data.guess[i] == data.solution[i] && data.lock[i] == 0) {
            data.correctguess++;
            data.lock[i] = 1; //lock the number as solution is correct - will prevent generating more numbers until cleared
        } 
        else if (data.guess[i] != data.solution[i] && data.lock[i] == 0){
            data.errorguess++;
        }
    }

    document.getElementById("correctguess").innerHTML = data.correctguess;
    document.getElementById("errorguess").innerHTML = data.errorguess;
}

function returnRandomInteger(min, max) { //returns a random integer, min & max included
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}