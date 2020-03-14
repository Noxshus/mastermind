let devTools = 1;

var data = {
    guess: Array(3).fill(0),
    solution: Array(3).fill(0),
    accuracy: 0,
    solutionCeiling: 3, //the max value a solution integer can have
    solutionFloor: 0, //the min value a solution integer can have
    errorGuess: 0, //currency
    solutionSolved: 0, //currency
    tickSpeed: 1000, //ms
    timeToSolve: [0, 0, 0, 0], //contains the time it took to solve
    tickToSolve: [0, 0, 0, 0], //contains the number of ticks that pass to solve
    errorsToSolve: [0, 0, 0, 0], //contains a count of the number of errors generated per solve
    timeMean: 0, //storage for mean values
    tickMean: 0, //^
    errorMean: 0, //^
    nodeXP: 0, //holds xp towards a node
    nodeXPToLevel: 100, //node XP required to level up and gain a new node
    totalNodes: 0, //total number of nodes
    flag: Array(5).fill(0), //not supported on IE
    lockChance: 0,
    lock: Array(3).fill(false),
};

window.onload = function() {
    if (devTools == 1) {
        this.enableDev();
    }

    for (let i = 0; i < this.data.solution.length; i++) { //load some SOLUTION numbers at page load
        this.data.solution[i] = this.returnRandomInteger(data.solutionFloor, data.solutionCeiling);
        this.document.getElementById("sol" + i).innerHTML = this.data.solution[i];
    }

    document.getElementById("guessbuttondisable").disabled = true; //sometimes, on refresh, disabled button isn't disabled by default for some reason

    document.getElementById("nodexp").innerHTML = this.data.nodeXP;
    document.getElementById("nodexptolevel").innerHTML = this.data.nodeXPToLevel;
}

// Functions related to the #guess - #compare - #generate loop -------------------------------------------------------------------------------------

let updateLoop = setInterval(update, 1000); //seperate to everything else, we run checks to see if stuff needs to be unlocked. Seperated from the guessLoop so that we don't spam checks needlessly

function update() {

}

function guessLoop() { //begin the guess loop
    guessLoopGlobal = setInterval(guess, data.tickSpeed);
    document.getElementById("guessbutton").disabled = true;
    document.getElementById("guessbuttondisable").disabled = false;
}

function guessLoopDisable() { //disable the loop
    clearInterval(guessLoopGlobal);
    document.getElementById("guessbutton").disabled = false;
    document.getElementById("guessbuttondisable").disabled = true;
}

function guess() { //principle solution guessing function
    for (let i = 0; i < data.solution.length; i++) { //attempt a guess
        if (data.lock[i] == false) {
            data.guess[i] = returnWeighedGuessInteger(data.solution[i]);
            document.getElementById("guess" + i).innerHTML = data.guess[i];
        }
    }

    const _correctGuessCount = compare();

    if (_correctGuessCount == data.solution.length) { //guess matched the solution
        if (upgradeSolution() == true) {
            solved("upgrade");
        }
        else {
            solved("solved");
        }
    }
    else { //solution not reached, generates error(s) & need to check if we need to increase accuracy value
        updateErrorsToSolve("tick"); //we only update errors-to-solve on a tick and not on a solution because otherwise we get one extra tick of errors
        updateTimeToSolve("tick");
        data.errorGuess++; // NEEDS TO BE UPDATED *******************************

        if (data.accuracy < _correctGuessCount) //increase accuracy if we're getting closer to the solution
        {
            data.accuracy = _correctGuessCount;
            document.getElementById("accuracy").innerHTML = data.accuracy;
        }

        document.getElementById("errorguess").innerHTML = data.errorGuess;
    }
}

function compare() //compare the solution & guess arrays, returns the number of correct guesses. Runs locking to see if any of them lock
{
    let _correctGuessCount = 0; //reset correct guess count at the start of the loop

    for (let i = 0; i < data.solution.length; i++) {
        if (data.guess[i] == data.solution[i]) {
            _correctGuessCount++;
            if (data.lock[i] == false && rollForCrit(data.lockChance) == true) //if number isn't already locked, roll for a chance to lock it
            {
                data.lock[i] = true;
                document.getElementById("guess" + i).style.color = "#5cb85c" ; //green
            }
            else if (data.lock[i] == false) {
                document.getElementById("guess" + i).style.color = "#5bc0de"; //light blue
            }
        } 
        else if (data.guess[i] != data.solution[i]) {           
            document.getElementById("guess" + i).style.color = "#d9534f"; //red
        }
    }

    return _correctGuessCount;
}

function generateSolution(reason) //used to create a new solution after solving the previous one
{ 
    switch (reason) {
        case "solved": //we generate a new solution when solving the old one; logic is currently the same regardless
        case "upgrade":
            for (let i = 0; i < data.solution.length; i++) {
                data.solution[i] = returnRandomInteger(data.solutionFloor, data.solutionCeiling);
                data.accuracy = 0; //reset accuracy value
                data.lock[i] = false; //reset the locks array
                document.getElementById("sol" + i).innerHTML = data.solution[i];
                document.getElementById("guess" + i).style.color = "#0275d8"; //bootstrap blue
            }
            updateErrorsToSolve(reason);
            updateTimeToSolve(reason);
            break;
    }
}

function solved(reason) //compilation of logic when a solution has been solved
{
    switch (reason) {
        case "upgrade":
        case "solved":
            data.solutionSolved++; // NEEDS TO BE UPDATED *******************************
            updateTimeToSolve("tick"); //process time statistics because we still needed a tick to get here
            gainNodeProgress(); //gain progress towards building a node
            document.getElementById("solvedsolution").innerHTML = data.solutionSolved;
            generateSolution(reason);
            break;
    }
}

// ----------------------------------------- #upgrades ----------------------------------------------------------------------------------------------

//Functions related to #chance

function rollForCrit(critchance) //critchance should be a % value
{
    const roll = returnRandomNumberWithDecimals(0, 100, 2);
    
    if (roll <= critchance)
    {
        return true;
    }
    else {
        return false;
    }
}

// Functions related to #nodes --------------------------------------------------------------------------------------------------------------------------------------

function gainNodeProgress()
{
    let _nodePercent = 0;

    data.nodeXP++; // NEEDS TO BE UPDATED *******************************

    if (data.nodeXP >= data.nodeXPToLevel) //if incrementing xp right now caused us to level up, then do so (to )
    {
        levelUpNode();
    }

    _nodePercent = (data.nodeXP / data.nodeXPToLevel) * 100;
    document.getElementById("nodeprogress").style.width = _nodePercent + "%";
    document.getElementById("nodexp").innerHTML = data.nodeXP;

    if (Number.isInteger(_nodePercent) == false) { //Haven't quite understood why, but sometimes the % number gets like 10 decimal places. In that instance, only display 2 places
        _nodePercent = _nodePercent.toFixed(2);
    }
    document.getElementById("nodeprogresstext").innerHTML = _nodePercent + "%";
}

function levelUpNode()
{
    data.totalNodes++;
    data.nodeXP = data.nodeXP - data.nodeXPToLevel; //so we can keep any overflow to the next level
    data.nodeXPToLevel = data.nodeXPToLevel * 2; // NEEDS TO BE UPDATED --- PROGRESSION
    _nodePercent = (data.nodeXP / data.nodeXPToLevel) * 100;
    document.getElementById("nodexptolevel").innerHTML = data.nodeXPToLevel;
    document.getElementById("nodecount").innerHTML = data.totalNodes;
}

// Functions related to upgrading #solution #length #floor #ceiling ---------------------------------------------------------------------------

function upgradeSolution() //upgrades both solution length & ceiling if they're both under <10
{
    if (data.solutionCeiling < 9 && data.solution.length < 10) { //upgrade logic
        upgradeSolutionLength();
        upgradeSolutionCeiling();
        return true;
    }

    return false;
}

function upgradeSolutionLength()
{
    extendArrays(); //extend the length of the arrays (+ will run the HTML update)
    clearStatistics("upgrade");  
}

function extendArrays() //used when increasing the solution length
{
    data.solution.push(0);
    data.guess.push(0);
    data.lock.push(false);

    //update the HTML after extending the arrays
    let _newSolutionElement = document.createElement("span"); 
    _newSolutionElement.id = "sol" + (data.solution.length - 1);
    _newSolutionElement.innerHTML = 0;
    document.getElementById("solutiondiv").appendChild(document.createTextNode (" "));
    document.getElementById("solutiondiv").appendChild(_newSolutionElement);
    let _newGuessElement = document.createElement("span");
    _newGuessElement.id = "guess" + (data.solution.length - 1);
    _newGuessElement.innerHTML = 0;
    document.getElementById("guessdiv").appendChild(document.createTextNode (" "));
    document.getElementById("guessdiv").appendChild(_newGuessElement);
}

function upgradeSolutionCeiling()
{
    data.solutionCeiling++;
    clearStatistics("upgrade");
}

// Functions related to #locking

function upgradeLocking()
{
    data.lockChance++;
    document.getElementById("lockchance").innerHTML = data.lockChance;
}

//Functions related to #statistics---------------------------------------------------------------------------------------------------------------------

function updateTimeToSolve(reason) //function to update the time-related statistics
{
    switch (reason)
    {
        case "solved": //if we solved
        case "upgrade": //behaviour currently the same in-case of an upgrade
            document.getElementById("timetosolveprevious").innerHTML = data.timeToSolve[1]; //update first because updateMean will clear it
            document.getElementById("ticktosolveprevious").innerHTML = data.tickToSolve[1];
            updateMean("time"); //if we solved, then need to update previous time [1] with current [0] + reset the current time [0] + shift all previous times right
            updateMean("tick"); //as above, but for ticks
            break;
        case "tick": //whenever we tick, we need to update the current time [0]
            data.timeToSolve[0] = data.timeToSolve[0] + (data.tickSpeed / 1000); //to get result in seconds, not ms
            data.tickToSolve[0]++;
            document.getElementById("timetosolvecurrent").innerHTML = data.timeToSolve[0];
            document.getElementById("ticktosolvecurrent").innerHTML = data.tickToSolve[0];
            break;
        case "clear":
            document.getElementById("timetosolvecurrent").innerHTML = data.timeToSolve[0];
            document.getElementById("ticktosolvecurrent").innerHTML = data.tickToSolve[0];
            document.getElementById("timetosolveprevious").innerHTML = data.timeToSolve[1];
            document.getElementById("ticktosolveprevious").innerHTML = data.tickToSolve[1];
            document.getElementById("timemean").innerHTML = data.timeMean;
            document.getElementById("tickmean").innerHTML = data.tickMean;
            break;
    }
}

function updateErrorsToSolve(reason) //functions mostly the same as above
{
    switch (reason)
    {
        case "solved":
        case "upgrade":
            document.getElementById("errorstosolveprevious").innerHTML = data.errorsToSolve[1]; //update first because updateMean will clear it
            updateMean("error");  
            break;
        case "tick":
            data.errorsToSolve[0] = data.errorsToSolve[0] + 1; //NEEDS TO BE UPDATED *************************
            document.getElementById("errorstosolvecurrent").innerHTML = data.errorsToSolve[0];
            break;
        case "clear":
            document.getElementById("errorstosolvecurrent").innerHTML = data.errorsToSolve[0];
            document.getElementById("errorstosolveprevious").innerHTML = data.errorsToSolve[1];
            document.getElementById("errormean").innerHTML = data.errorMean;
            break;
    }
}

function updateMean(type) //function to shift all the numbers in the array to the right, then calculate the mean and update HTML
{
    let _total = 0; //used to hold the sum
    let _rawNumber = 0; //use to hold the average before decimal pruning
    switch (type)
    {
        case "time":
            for (let i = data.timeToSolve.length - 1; i >= 0; i--) {
                if (i == 0)
                {
                    data.timeToSolve[i] = 0;
                }
                else {
                    data.timeToSolve[i] = data.timeToSolve[i - 1];
                    _total = _total + data.timeToSolve[i];
                }
            }
            _rawNumber = _total / (data.timeToSolve.length - 1);
            data.timeMean = _rawNumber.toFixed(2);
            document.getElementById("timemean").innerHTML = data.timeMean;
            break;

        case "tick":
            for (let i = data.tickToSolve.length - 1; i >= 0; i--) {
                if (i == 0)
                {
                    data.tickToSolve[i] = 0;
                }
                else {
                    data.tickToSolve[i] = data.tickToSolve[i - 1];
                    _total = _total + data.tickToSolve[i];
                }
            }
            _rawNumber = _total / (data.tickToSolve.length - 1);
            data.tickMean = _rawNumber.toFixed(2);
            document.getElementById("tickmean").innerHTML = data.tickMean;
            break;

        case "error":
            for (let i = data.errorsToSolve.length - 1; i >= 0; i--) {
                if (i == 0)
                {
                    data.errorsToSolve[i] = 0;
                }
                else {
                    data.errorsToSolve[i] = data.errorsToSolve[i - 1];
                    _total = _total + data.errorsToSolve[i];
                }
            }
            _rawNumber = _total / (data.errorsToSolve.length - 1);
            data.errorMean = _rawNumber.toFixed(2);
            document.getElementById("errormean").innerHTML = data.errorMean;
            break;
    }
}

function clearStatistics(reason) //clears all previous statistical values (but leaves current ones alone)
{
    switch (reason)
    {
        case "clear": //when player wants to clear the stored solve values
            //start at i = 1 to avoid clearing 0 (current value
            for (let i = 1; i < data.timeToSolve.length; i++) {
                data.timeToSolve[i] = 0;
            }
            data.timeMean = 0;
            for (let i = 1; i < data.tickToSolve.length; i++) {
                data.tickToSolve[i] = 0;
            }
            data.tickMean = 0;
            for (let i = 1; i < data.errorsToSolve.length; i++) {
                data.errorsToSolve[i] = 0;
            }
            data.errorMean = 0;

            updateTimeToSolve("clear");
            updateErrorsToSolve("clear");
            break;
        case "upgrade": //restart the current timers
            data.timeToSolve[0] = 0;
            data.tickToSolve[0] = 0;
            data.errorsToSolve[0] = 0;
            break;
    }
    
}

//#DEV FUNCTIONS --------------------------------------------------------------------------------------------------

function enableDev()
{
    //display all testing buttons
    const _dev = document.getElementsByClassName("devtool");
    for (let i = 0; i < _dev.length; i++) {
            _dev[i].style.display = "inline";
    }

    //make all flex coloumns more obvious
    let _columnstyle = document.getElementsByClassName("leftcolumn");
    for (let i = 0; i < _columnstyle.length; i++) {
        _columnstyle[i].style.backgroundColor = "#D0D0D0";
    }
    _columnstyle = document.getElementsByClassName("centercolumn");
    for (let i = 0; i < _columnstyle.length; i++) {
        _columnstyle[i].style.backgroundColor = "#E0E0E0";
    }
    _columnstyle = document.getElementsByClassName("rightcolumn");
    for (let i = 0; i < _columnstyle.length; i++) {
        _columnstyle[i].style.backgroundColor = "#C0C0C0";
    }
}

function devAddSolution()
{
    data.solutionSolved = data.solutionSolved + 10;
}

function devAddNodeXP()
{
    data.nodeXP = data.nodeXPToLevel - 3;
}

//#MISC FUNCTIONS --------------------------------------------------------------------------------------------------

function returnRandomInteger(min, max) //returns a random integer, min & max included
{ 
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function returnRandomNumberWithDecimals(min, max, decimalPlaces) { //https://stackoverflow.com/questions/45735472/generate-a-random-number-between-2-values-to-2-decimals-places-in-javascript
    const rand = Math.random() < 0.5 ? ((1-Math.random()) * (max-min) + min) : (Math.random() * (max-min) + min);  // could be min or max or anything in between
    const power = Math.pow(10, decimalPlaces);
    return Math.floor(rand * power) / power;
}

function returnWeighedGuessInteger(solutionValue) //uses global values to weight the return value
{ 
    if (data.accuracy > 0) {
        
        if (data.solutionCeiling - data.accuracy >= solutionValue) { //if we can take off enough from the ceiling, do so
            return returnRandomInteger(data.solutionFloor, data.solutionCeiling - data.accuracy);
        }
        else if (data.solutionFloor + data.accuracy <= solutionValue) { //if we couldn't take from the ceiling, add to the floor
            return returnRandomInteger(data.solutionFloor + data.accuracy, data.solutionCeiling)
        }
        else { //if we couldn't do either of those things, we need to split accuracy between floor & ceiling
            if (data.solutionCeiling - data.accuracy < solutionValue) { //if we can't take enough off the top, then
                let _difference = data.solutionCeiling - data.accuracy; //calculate the difference - Math.abs to convert it into a positive int
                //console.log(data.accuracy);
                //console.log ("First block:" + _difference);
                if (data.solutionFloor + _difference <= solutionValue) { //********** redundant ?
                    return returnRandomInteger(data.solutionFloor + _difference, solutionValue);
                }
            }
            else if (data.solutionFloor + data.accuracy > solutionValue) { //if we couldn't take enough off the top, then bottom, then try the other way, starting with the floor instead
                let _difference = data.solutionFloor + data.accuracy; //calculate the difference
                //console.log ("Second block:" + _difference);
                if (data.solutionCeiling - _difference >= solutionValue) {
                    return returnRandomInteger(solutionValue, data.solutionCeiling - _difference);
                }
            }
            else { //if neither criteria is met, then accuracy is 100%, go ahead and return the solutionvalue
                //console.log ("Third block");
                return solutionValue;
            }
        }
    }

    else { //if weight values are 0, then return a random value
        return returnRandomInteger(data.solutionFloor, data.solutionCeiling);
    }
}