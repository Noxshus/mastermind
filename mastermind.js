var devTools = 1;

var data = {
    guess: [0, 0, 0],
    solution: [0, 0, 0],
    lock: [0, 0, 0],
    solutionceiling: 3, //the max value a solution integer can have
    solutionfloor: 0, //the min value a solution integer can have
    errorguess: 0,
    solutionsolved: 0,
    flag: Array(5).fill(0), //not supported on IE
};

window.onload = function() {
    if (devTools == 1) {
        this.enableDev();
    }

    for (i = 0; i < this.data.solution.length; i++) { //load some SOLUTION numbers at page load
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
        document.getElementById("solutionceilingbutton").style.display = "inline";
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
    for (i = 0; i < data.solution.length; i++) {
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

    for (i = 0; i < data.solution.length; i++) {
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
        data.solutionsolved++;
        generateSolution("solved");
    } 
    else {
        data.errorguess++;
    }

    document.getElementById("errorguess").innerHTML = data.errorguess;
    document.getElementById("solvedsolution").innerHTML = data.solutionsolved;

}

function generateSolution(reason) { //used to create a new solution after solving the previous one
    switch (reason) {
        case "solved": //we generate a new solution when solving the old one
            for (i = 0; i < data.solution.length; i++) {
                data.lock[i] = 0; //we need to clear the lock array! Very important, or can't create new locks
                data.solution[i] = returnRandomInteger(data.solutionfloor, data.solutionceiling);
                document.getElementById("sol" + i).innerHTML = data.solution[i];
                document.getElementById("guess" + i).style.color = "#0275d8"; //some visual feedback that a solution was reached - blue
            }
            break;
        case "upgrade": //we generate a new solution when upgrading. Only functional difference here is we change guess to yellow instead of blue to signify this
            for (i = 0; i < data.solution.length; i++) {
                data.lock[i] = 0; //we need to clear the lock array! Very important, or can't create new locks
                data.solution[i] = returnRandomInteger(data.solutionfloor, data.solutionceiling);
                document.getElementById("sol" + i).innerHTML = data.solution[i];
                document.getElementById("guess" + i).style.color = "#f0ad4e"; //warning colour
            }
            break;
    }
    
    
}


// Functions related to upgrading solution length ---------------------------------------------------------------------------

function upgradeSolutionLength()
{
    if (data.solutionsolved >= 10) {
        data.solutionsolved = data.solutionsolved - 10;

        extendArrays(); //extend the length of the arrays (+ will run the HTML update)
    }    
}

function extendArrays() //used when increasing the solution length
{
    data.solution.push(0);
    data.guess.push(0);
    data.lock.push(0); //should default to unlocked - guess loop will lock it if it's already correct

    updateHTMLWithSolutionLengthIncrease();
    generateSolution("upgrade");
}

function updateHTMLWithSolutionLengthIncrease() //used to update the HTML after extending the arrays
{
    var newSolutionElement = document.createElement("span");
    newSolutionElement.id = "sol" + (data.solution.length - 1);
    newSolutionElement.innerHTML = 0;
    document.getElementById("solutiondiv").appendChild(document.createTextNode (" "));
    document.getElementById("solutiondiv").appendChild(newSolutionElement);
    var newGuessElement = document.createElement("span");
    newGuessElement.id = "guess" + (data.solution.length - 1);
    newGuessElement.innerHTML = 0;
    document.getElementById("guessdiv").appendChild(document.createTextNode (" "));
    document.getElementById("guessdiv").appendChild(newGuessElement);
}

// Functions related to upgrading solution floor + ceiling --------------------------------------------------------------------------------------------------

function upgradeSolutionCeiling()
{
    if (data.solutionsolved >= 10) {
        data.solutionsolved = data.solutionsolved - 10;

        data.solutionceiling++;
        generateSolution("upgrade"); //generate a fresh solution using the new ceiling
    }    
}

//DEV FUNCTIONS --------------------------------------------------------------------------------------------------

function enableDev()
{
    //display all testing buttons
    var dev = document.getElementsByClassName("devtool");
    for (i = 0; i < dev.length; i++) {
            dev[i].style.display = "inline";
    }

    //make all flex coloumns more obvious
    var columnstyle = document.getElementsByClassName("leftcolumn");
    for (i = 0; i < columnstyle.length; i++) {
        columnstyle[i].style.backgroundColor = "#D0D0D0";
    }
    columnstyle = document.getElementsByClassName("centercolumn");
    for (i = 0; i < columnstyle.length; i++) {
        columnstyle[i].style.backgroundColor = "#E0E0E0";
    }
    columnstyle = document.getElementsByClassName("rightcolumn");
    for (i = 0; i < columnstyle.length; i++) {
        columnstyle[i].style.backgroundColor = "#C0C0C0";
    }
}

function devAddSolution()
{
    data.solutionsolved = data.solutionsolved + 10;
}

//MISC FUNCTIONS --------------------------------------------------------------------------------------------------

function returnRandomInteger(min, max) { //returns a random integer, min & max included
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}