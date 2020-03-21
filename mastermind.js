var global = { //store for global variables, which we don't need to save between sessions
    devTools: true,
    saveGame: true, //testing variable

    gameTimer: 60,
    guess: Array(3).fill(0),
    solution: Array(3).fill(0),
    accuracy: Array(3).fill(0),
    lock: Array(3).fill(false),
    solutionCeiling: 2, //the max value a solution integer can have
    solutionFloor: 0, //the min value a solution integer can have
    timeToSolve: [0, 0, 0, 0], //contains the time it took to solve
    tickToSolve: [0, 0, 0, 0], //contains the number of ticks that pass to solve
    errorsToSolve: [0, 0, 0, 0], //contains a count of the number of errors generated per solve
    mean: [0, 0, 0], //time, tick, error
    solutionMultipler: 1, //increases whenever complexity increases, uses to multiply solution & error gain
}

var data = {
    errorGuess: 0, //currency
    solutionSolved: 0, //currency
    tickSpeed: 1000, //ms
    nodeXP: 0, //holds xp towards a node
    nodeXPToLevel: 10, //node XP required to level up and gain a new node
    totalNodes: 0, //total number of nodes
    nodeAssignments: Array(4).fill(0), //0: accuracy, 1: locking, 2: critguess
    skill: Array(4).fill(0), //array which holds skill % values; 0: accuracy, 1: locking
    skillXP: Array(4).fill(0), //0: accuracy, 1: locking
    skillXPToLevel: Array(4).fill(10),
    flag: Array(5).fill(0),
};

window.onload = function() {
    if (global.devTools == true) {
        enableDev();
    }

    for (let i = 0; i < global.solution.length; i++) { //load some SOLUTION numbers at page load
        global.solution[i] = returnRandomInteger(global.solutionFloor, global.solutionCeiling);
        document.getElementById("sol" + i).innerHTML = global.solution[i];
    }

    document.getElementById("guessbuttondisable").disabled = true; //sometimes, on refresh, disabled button isn't disabled by default for some reason

    loadGame(); //check if we've got save game data to load - otherwise the data object will use default values
    document.getElementById("errorguess").innerHTML = data.errorGuess;
    document.getElementById("solvedsolution").innerHTML = data.solutionSolved;
    const _nodePercent = (data.nodeXP / data.nodeXPToLevel) * 100;
    document.getElementById("nodexp").innerHTML = data.nodeXP;
    document.getElementById("nodeprogresstext").innerHTML = _nodePercent + "%";
    document.getElementById("nodeprogress").style.width = _nodePercent + "%";
    document.getElementById("nodexptolevel").innerHTML = data.nodeXPToLevel;
    document.getElementById("totalnodes").innerHTML = data.totalNodes;
    for (let i = 0; i < this.data.nodeAssignments.length; i++) {
        const _skill = returnSkillNameOrNumber(i);
        document.getElementById(_skill + "nodes").innerHTML = data.nodeAssignments[i];
        document.getElementById(_skill + "chance").innerHTML = data.skill[i] + "%";
        const _subNodePercent = (data.skillXP[i] / data.skillXPToLevel[i]) * 100;
        document.getElementById(_skill + "progress").style.width = _subNodePercent + "%";
        document.getElementById(_skill + "progressxptooltip").innerHTML = data.skillXP[i];
        document.getElementById(_skill + "progressleveltooltip").innerHTML = data.skillXPToLevel[i];
    }

    if (data.flag[0] == 1) //need a better way to do this, lol.
    {
        document.getElementById("accuracycorrectbutton").remove();
    }
}

function saveGame() 
{
    if (global.saveGame == true) {
        localStorage.setItem("mastermindIncrementalSave", JSON.stringify(data));
    }
}

function loadGame() 
{
    let checkSave = JSON.parse(localStorage.getItem("mastermindIncrementalSave"));
    if (checkSave !== null) {
        data = checkSave;
    }
}

// Functions related to the #guess - #compare - #generate loop -------------------------------------------------------------------------------------

let saveLoop = setInterval(saveGame, 30000); //saves every 30 seconds

let updateLoop = setInterval(update, 1000); //seperate to everything else, we run checks to see if stuff needs to be unlocked. Seperated from the guessLoop so that we don't spam checks needlessly

function update() {

}

function guessLoop() { //begin the guess loop
    guessLoopGlobal = setInterval(guess, data.tickSpeed);
    startGameTimer("on");
    document.getElementById("guessbutton").disabled = true;
    document.getElementById("guessbuttondisable").disabled = false;
}

function guessLoopDisable() { //disable the loop
    clearInterval(guessLoopGlobal);
    startGameTimer("off");
    document.getElementById("guessbutton").disabled = false;
    document.getElementById("guessbuttondisable").disabled = true;
}

function guess() { //principle solution guessing function
    if (global.gameTimer <= 0) { //first we check if the time has expired
        startGameTimer("restart");
        generateSolution("timer");
    }
    else {
        for (let i = 0; i < global.solution.length; i++) { //attempt a guess
            if (global.lock[i] == false) {
                global.guess[i] = returnWeighedGuessInteger(global.solution[i], global.accuracy[i]);
                document.getElementById("guess" + i).innerHTML = global.guess[i];
            }
        }
    
        const _correctGuessCount = compare(); //returns the number of correct guesses + runs a number of functions related to comparision, including any crits
    
        if (_correctGuessCount == global.solution.length) { //guess matched the solution
            if (checkForUpgradeSolution() == true) {
                solved("upgrade");
            }
            else {
                solved("solved");
            }
        }
        else { //solution not reached, generates error(s)
            updateErrorsToSolve("tick"); //we only update errors-to-solve on a tick and not on a solution because otherwise we get one extra tick of errors
            updateTimeToSolve("tick");
            data.errorGuess = data.errorGuess + global.solutionMultipler;
            document.getElementById("errorguess").innerHTML = data.errorGuess;
        }
        
        updateAccuracy(); //updates the accuracy point tooltip
    }
}

function compare() //compare the solution & guess arrays, returns the number of correct guesses. Runs locking to see if any of them lock + checks for accuracy increase
{
    let _correctGuessCount = 0; //reset correct guess count at the start of the loop

    for (let i = 0; i < global.solution.length; i++) {
        if (global.guess[i] == global.solution[i]) { //correct guess
            _correctGuessCount++;

            if (global.lock[i] == false && rollForCrit(data.skill[1]) == true) { //if number isn't already locked, roll for a chance to lock it
                global.lock[i] = true;
                document.getElementById("guess" + i).style.color = "#5cb85c" ; //green
            }
            else if (global.lock[i] == false) {
                increaseAccuracy("correct", data.skill[0], i); //add accuracy when guessing correctly
                document.getElementById("guess" + i).style.color = "#5bc0de"; //light blue
            }
        } 
        else if (global.guess[i] != global.solution[i]) { //incorrect guess
            if (rollForCritGuess() == true) { //roll for a critical guess
                global.guess[i] = global.solution[i];
                _correctGuessCount++;
                document.getElementById("guess" + i).innerHTML = global.guess[i];
                document.getElementById("guess" + i).style.color = "#0275d8"; //dark blue - the solve colour
            }
            else {
                if (global.accuracy[i] < global.solutionCeiling && data.skill[0] > 0) { //increase accuracy for a incorrect guess, with a % chance. Accuracy must be greater than 0
                    increaseAccuracy("incorrect", data.skill[0], i);
                }   
                document.getElementById("guess" + i).style.color = "#d9534f"; //red
            }
        }
    }

    return _correctGuessCount;
}

function generateSolution(reason) //used to create a new solution after solving the previous one
{ 
    switch (reason) {
        case "solved": //we generate a new solution when solving the old one; logic is currently the same regardless
        case "upgrade":
            for (let i = 0; i < global.solution.length; i++) {
                global.solution[i] = returnRandomInteger(global.solutionFloor, global.solutionCeiling);
                global.accuracy[i] = 0; //reset accuracy value
                global.lock[i] = false; //reset the locks array
                global.gameTimer = 61; //restart the game timer - 61 because we tick once immediately
                document.getElementById("sol" + i).innerHTML = global.solution[i];
                document.getElementById("guess" + i).style.color = "#0275d8"; //bootstrap blue
            }
            updateErrorsToSolve(reason);
            updateTimeToSolve(reason);
            break;
        case "timer": //timer expired
            if (global.solution.length > 3) { //this means it's been upgraded at least once
                for (let i = 3; i < global.solution.length; i++) {
                    document.getElementById("sol" + i).remove();
                    document.getElementById("guess" + i).remove();
                }
                global.solution.length = 3; //return everything to original values
                global.accuracy.length = 3;
                global.lock.length = 3;
                global.solutionCeiling = 2;
                global.solutionMultipler = 1;
            }
            for (let i = 0; i < global.solution.length; i++) {
                global.solution[i] = returnRandomInteger(global.solutionFloor, global.solutionCeiling);
                global.accuracy[i] = 0; //reset accuracy value
                global.lock[i] = false; //reset the locks array
                document.getElementById("sol" + i).innerHTML = global.solution[i];
                document.getElementById("guess" + i).style.color = "#f0ad4e"; //bootstrap blue
            }
            clearStatistics("restart");
            break;
    }
}

function solved(reason) //compilation of logic when a solution has been solved
{
    switch (reason) {
        case "upgrade":
            if (global.solution.length > 3) { //only trigger when complexity has already been upgraded once before, to prevent the solution from getting the benefit right away
                global.solutionMultipler = global.solutionMultipler + (growthCurve("sublinear", global.solutionMultipler));
            }
            upgradeSolutionLength();
            upgradeSolutionCeiling();
        case "solved":
            if (rollForCritSolve() == true) {
                data.solutionSolved = (data.solutionSolved + global.solutionMultipler) * 2;
            }
            else {
                data.solutionSolved = data.solutionSolved + global.solutionMultipler;
            }
            updateTimeToSolve("tick"); //process time statistics because we still needed a tick to get here
            gainNodeProgress(); //gain progress towards building a node
            document.getElementById("solvedsolution").innerHTML = data.solutionSolved;
            generateSolution(reason);
            break;
    }
}

// ----------------------------------------- #upgrades ----------------------------------------------------------------------------------------------
//Functions related to #chance

function rollForCrit(critChance) //critchance should be a % value, up to 2 decimals
{
    const roll = returnRandomNumberWithDecimals(0, 100, 2);
    
    if (roll < critChance) { //we use < only and not =< to prevent a scenario where even a value of 0 is considered a crit
        return true;
    }
    else {
        return false;
    }
}

function criticalPopup(type) //handles the appearence of a little exclaimation mark near solutions or errors currency, to indicate that a crit occured
{
    switch (type) {
        case "solve":
            const popup = document.getElementById("critsolvepopup");
            popup.classList.toggle("show");
            setTimeout(function() {popup.classList.toggle("show")}, data.tickSpeed);
            console.log("triggered");
            break;
    }
}

//Functions related to #accuracy

function upgradeAccuracy(type)
{
    switch (type) {
        case 0: //enables accuracy
            if (data.errorGuess >= 50) {
                data.errorGuess = data.errorGuess - 50;
                data.skill[0]++;
                document.getElementById("accuracychance").innerHTML = data.skill[0] + "%";
            }
            break;
        case 1: //one time upgrade to grant a bonus to accuracy on a correct guess
            if (data.errorGuess >= 1000 && data.flag[0] == 0) {
                data.errorGuess = data.errorGuess - 1000;
                data.flag[0] = 1;
                document.getElementById("accuracycorrectbutton").remove();
            }
    }
    document.getElementById("errorguess").innerHTML = data.errorGuess;
}

function increaseAccuracy(reason, chance, accuracyElement) //logic behind gain a point of accuracy (or not)
{
    if (global.accuracy[accuracyElement] < global.solutionCeiling) {
        switch (reason) {
            case "correct": //correct guess - double the chance to get it right
                if (data.flag[0] && rollForCrit(chance * 2) == true)
                {
                    global.accuracy[accuracyElement]++;
                }
                break;
            case "incorrect": //incorrect guess - each level of accuracy makes it more difficult to increase accuracy.
                if (rollForCrit(chance / global.accuracy[accuracyElement]) == true) { //should never call this while accuracy is 0, or this will explode
                    global.accuracy[accuracyElement]++;
                }
                break;
        }
    }
}

function updateAccuracy() //updates the accuracy point count in the tooltip
{
    let _acc = ""; //update the accuracy values in the tooltops
    
    for(let i = 0; i < global.accuracy.length; i++) {
        _acc += global.accuracy[i] + " ";
    }

    document.getElementById("accuracycurrent").innerHTML = _acc;
}

//Functions related to #locking -----------------

function upgradeLocking(type)
{
    switch (type) { 
        case 0: //enable locking
            if (data.errorGuess >= 500) {
                data.errorGuess = data.errorGuess - 500
                data.skill[1]++;
                document.getElementById("lockingchance").innerHTML = data.skill[1] + "%";
            }
            break;
    }
    document.getElementById("errorguess").innerHTML = data.errorGuess;
}

// Functions related to #critical guess

function upgradeCritGuess(type)
{
    switch (type) {
        case 0: //enables crit guesses
            if (data.errorGuess >= 5000) { 
                data.errorGuess = data.errorGuess - 5000;
                data.skill[2]++;
                document.getElementById("critguesschance").innerHTML = data.skill[2] + "%";
            }
            break;
    }
    document.getElementById("errorguess").innerHTML = data.errorGuess;   
}

function rollForCritGuess() //check for a critical guess
{
    if (rollForCrit(data.skill[2]) == true) {
        return true;
    }
    else {
        return false;
    }
}

// Functions related to #critical solves

function upgradeCritSolve(type)
{
    switch (type) {
        case 0: //enables crit solves
            if (data.errorGuess >= 5000) { 
                data.errorGuess = data.errorGuess - 5000;
                data.skill[3]++;
                document.getElementById("critsolvechance").innerHTML = data.skill[3] + "%";
            }
            break;
    }
    document.getElementById("errorguess").innerHTML = data.errorGuess;
}

function rollForCritSolve() //check for a critical solve
{
    if (rollForCrit(data.skill[3]) == true) {
        criticalPopup("solve");
        return true;
    }
    else {
        return false;
    }
}


// Functions related to #nodes --------------------------------------------------------------------------------------------------------------------------------------

function gainNodeProgress()
{
    data.nodeXP = data.nodeXP + global.solutionMultipler;

    if (data.nodeXP >= data.nodeXPToLevel) { //if incrementing xp right now caused us to level up, then do so
        levelUpNode();
    }

    gainAssignedNodeProgress();

    let _nodePercent = (data.nodeXP / data.nodeXPToLevel) * 100;
    document.getElementById("nodeprogress").style.width = _nodePercent + "%";
    document.getElementById("nodexp").innerHTML = data.nodeXP;

    if (Number.isInteger(_nodePercent) == false) { //Haven't quite understood why, but sometimes the % number gets like 10 decimal places. In that instance, only display 2 places
        _nodePercent = _nodePercent.toFixed(2);
    }
    document.getElementById("nodeprogresstext").innerHTML = _nodePercent + "%";
}

function gainAssignedNodeProgress() //if a node is assigned to a skill, generate progress for them too
{
    for (let i = 0; i < data.nodeAssignments.length; i++) {
        if (data.nodeAssignments[i] > 0) {
            data.skillXP[i] = data.skillXP[i] + (data.nodeAssignments[i] * global.solutionMultipler);
            const _percent = (data.skillXP[i] / data.skillXPToLevel[i]) * 100;
            document.getElementById(returnSkillNameOrNumber(i) + "progress").style.width = _percent + "%";
            document.getElementById(returnSkillNameOrNumber(i) + "progressxptooltip").innerHTML = data.skillXP[i];
        }

        if (data.skillXP[i] >= data.skillXPToLevel[i]) {
            levelUpAssignedNode(i);
        }
    }
}

function levelUpNode()
{
    data.totalNodes++;
    data.nodeXP = data.nodeXP - data.nodeXPToLevel; //so we can keep any overflow to the next level
    data.nodeXPToLevel = growthCurve("superlinear", data.nodeXPToLevel);
    document.getElementById("nodexptolevel").innerHTML = data.nodeXPToLevel;
    document.getElementById("totalnodes").innerHTML = data.totalNodes;
}

function levelUpAssignedNode(skill) //similar to levelling a node
{
    data.skill[skill]++;
    data.skillXP[skill] = data.skillXP[skill] - data.skillXPToLevel[skill];
    data.skillXPToLevel[skill] = growthCurve("superlinear", data.skillXPToLevel[skill]);
    const _percent = (data.skillXP[skill] / data.skillXPToLevel[skill]) * 100;
    document.getElementById(returnSkillNameOrNumber(skill) + "progress").style.width = _percent + "%";
    document.getElementById(returnSkillNameOrNumber(skill) + "chance").innerHTML = data.skill[skill] + "%";
    document.getElementById(returnSkillNameOrNumber(skill) + "progressxptooltip").innerHTML = data.skillXP[skill];
    document.getElementById(returnSkillNameOrNumber(skill) + "progressleveltooltip").innerHTML = data.skillXPToLevel[skill];
}

function assignNode(skill, add)
{
    const _skill = returnSkillNameOrNumber(skill);

    if (add == true) {    
        if (data.totalNodes >= 1) {
            data.totalNodes--;
            data.nodeAssignments[_skill]++;
        }
    }
    else if (add == false) {
        if (data.nodeAssignments[_skill] >= 1) {
            data.totalNodes++;
            data.nodeAssignments[_skill]--;
        }
    }

    document.getElementById("totalnodes").innerHTML = data.totalNodes;
    document.getElementById(skill + "nodes").innerHTML = data.nodeAssignments[_skill];
}

// Functions related to upgrading #solution #length #floor #ceiling ---------------------------------------------------------------------------

function checkForUpgradeSolution() //returns depend on whether or not length & ceiling if they're both under <10
{
    if (global.solutionCeiling < 9 && global.solution.length < 10) { //upgrade logic
        return true;
    }
    return false;
}

function upgradeSolutionLength()
{
    extendArrays(); //extend the length of the arrays (+ will run the HTML update)
}

function extendArrays() //used when increasing the solution length
{
    global.solution.push(0);
    global.guess.push(0);
    global.accuracy.push(0);
    global.lock.push(false);

    //update the HTML after extending the arrays
    let _newSolutionElement = document.createElement("span"); 
    _newSolutionElement.id = "sol" + (global.solution.length - 1);
    _newSolutionElement.innerHTML = 0;
    document.getElementById("solutiondiv").appendChild(document.createTextNode (" "));
    document.getElementById("solutiondiv").appendChild(_newSolutionElement);
    let _newGuessElement = document.createElement("span");
    _newGuessElement.id = "guess" + (global.solution.length - 1);
    _newGuessElement.innerHTML = 0;
    document.getElementById("guessdiv").appendChild(document.createTextNode (" "));
    document.getElementById("guessdiv").appendChild(_newGuessElement);
}

function upgradeSolutionCeiling()
{
    global.solutionCeiling++;
}

//Functions related to #statistics---------------------------------------------------------------------------------------------------------------------

function startGameTimer(reason) 
{
    switch (reason) {
        case "on":
            gameTimerLoop = setInterval(updateGameTimer, 1000);
            break;
        case "off":
            clearInterval(gameTimerLoop);
            break;
        case "restart":
            clearInterval(gameTimerLoop);
            global.gameTimer = 60;
            document.getElementById("gametimer").innerHTML = global.gameTimer;
            gameTimerLoop = setInterval(updateGameTimer, 1000);
            break;
    }
}

function updateGameTimer () 
{
    global.gameTimer--;
    document.getElementById("gametimer").innerHTML = global.gameTimer;
}

function updateTimeToSolve(reason) //function to update the time-related statistics
{
    switch (reason) {
        case "solved": //if we solved
        case "upgrade": //behaviour currently the same in-case of an upgrade
            updateMean("time"); //if we solved, then need to update previous time [1] with current [0] + reset the current time [0] + shift all previous times right
            updateMean("tick"); //as above, but for ticks
            document.getElementById("timetosolveprevious").innerHTML = global.timeToSolve[1];
            document.getElementById("ticktosolveprevious").innerHTML = global.tickToSolve[1];
            break;
        case "tick": //whenever we tick, we need to update the current time [0]
            global.timeToSolve[0] = global.timeToSolve[0] + (data.tickSpeed / 1000); //to get result in seconds, not ms
            global.tickToSolve[0]++;
            document.getElementById("timetosolvecurrent").innerHTML = global.timeToSolve[0];
            document.getElementById("ticktosolvecurrent").innerHTML = global.tickToSolve[0];
            break;
        case "clear":
            document.getElementById("timetosolvecurrent").innerHTML = global.timeToSolve[0];
            document.getElementById("ticktosolvecurrent").innerHTML = global.tickToSolve[0];
            document.getElementById("timetosolveprevious").innerHTML = global.timeToSolve[1];
            document.getElementById("ticktosolveprevious").innerHTML = global.tickToSolve[1];
            document.getElementById("timemean").innerHTML = global.mean[0];
            document.getElementById("tickmean").innerHTML = global.mean[1];
            break;
    }
}

function updateErrorsToSolve(reason) //functions mostly the same as above
{
    switch (reason)
    {
        case "solved":
        case "upgrade":
            updateMean("error");
            document.getElementById("errorstosolveprevious").innerHTML = global.errorsToSolve[1];
            break;
        case "tick":
            global.errorsToSolve[0] = global.errorsToSolve[0] + global.solutionMultipler;
            document.getElementById("errorstosolvecurrent").innerHTML = global.errorsToSolve[0];
            break;
        case "clear":
            document.getElementById("errorstosolvecurrent").innerHTML = global.errorsToSolve[0];
            document.getElementById("errorstosolveprevious").innerHTML = global.errorsToSolve[1];
            document.getElementById("errormean").innerHTML = global.mean[2];
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
            for (let i = global.timeToSolve.length - 1; i >= 0; i--) {
                if (i == 0)
                {
                    global.timeToSolve[i] = 0;
                }
                else {
                    global.timeToSolve[i] = global.timeToSolve[i - 1];
                    _total = _total + global.timeToSolve[i];
                }
            }
            _rawNumber = _total / (global.timeToSolve.length - 1);
            global.mean[0] = _rawNumber.toFixed(2);
            document.getElementById("timemean").innerHTML = global.mean[0];
            break;

        case "tick":
            for (let i = global.tickToSolve.length - 1; i >= 0; i--) {
                if (i == 0)
                {
                    global.tickToSolve[i] = 0;
                }
                else {
                    global.tickToSolve[i] = global.tickToSolve[i - 1];
                    _total = _total + global.tickToSolve[i];
                }
            }
            _rawNumber = _total / (global.tickToSolve.length - 1);
            global.mean[1] = _rawNumber.toFixed(2);
            document.getElementById("tickmean").innerHTML = global.mean[1];
            break;

        case "error":
            for (let i = global.errorsToSolve.length - 1; i >= 0; i--) {
                if (i == 0)
                {
                    global.errorsToSolve[i] = 0;
                }
                else {
                    global.errorsToSolve[i] = global.errorsToSolve[i - 1];
                    _total = _total + global.errorsToSolve[i];
                }
            }
            _rawNumber = _total / (global.errorsToSolve.length - 1);
            global.mean[2] = _rawNumber.toFixed(2);
            document.getElementById("errormean").innerHTML = global.mean[2];
            break;
    }
}

function clearStatistics(reason) //clears all previous statistical values (but leaves current ones alone)
{
    switch (reason)
    {
        case "clear": //when player wants to clear the stored solve values
            //start at i = 1 to avoid clearing 0 (current value
            for (let i = 1; i < global.timeToSolve.length; i++) {
                global.timeToSolve[i] = 0;
            }
            global.mean[0] = 0;
            for (let i = 1; i < global.tickToSolve.length; i++) {
                global.tickToSolve[i] = 0;
            }
            global.mean[1] = 0;
            for (let i = 1; i < global.errorsToSolve.length; i++) {
                global.errorsToSolve[i] = 0;
            }
            global.mean[2] = 0;

            updateTimeToSolve("clear");
            updateErrorsToSolve("clear");
            break;
        case "restart": //same as above, but we include the current timer too. Called on a restart, cause by the timer expiring.
            for (let i = 0; i < global.timeToSolve.length; i++) {
                global.timeToSolve[i] = 0;
            }
            global.mean[0] = 0;
            for (let i = 0; i < global.tickToSolve.length; i++) {
                global.tickToSolve[i] = 0;
            }
            global.mean[1] = 0;
            for (let i = 0; i < global.errorsToSolve.length; i++) {
                global.errorsToSolve[i] = 0;
            }
            global.mean[2] = 0;

            updateTimeToSolve("clear");
            updateErrorsToSolve("clear");
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
    document.getElementById("solutionsolved").innerHTML = data.errorGuess;
}

function devAddNodeXP()
{
    data.nodeXP = data.nodeXPToLevel - 3;
}

function devAddNodes()
{
    data.totalNodes = data.totalNodes + 10;
}

function devAddAcc()
{
    data.skill[0] = data.skill[0] + 10;
}

function devUpgradeLocking()
{
    data.skill[1] = data.skill[1] + 10;
}

function devAddErrors()
{
    data.errorGuess = data.errorGuess + 100;
    document.getElementById("errorguess").innerHTML = data.errorGuess;
}

function devReduceTime()
{
    global.gameTimer = global.gameTimer - 10;
}

function devDeleteSave()
{
    localStorage.removeItem("mastermindIncrementalSave");
}

function devIncreaseCritGuess()
{
    data.skill[2] = data.skill[2] + 10;
}

function devIncreaseCritSolve()
{
    data.skill[3] = data.skill[3] + 10;
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

function returnWeighedGuessInteger(solutionValue, accuracy) //uses global values to weight the return value
{ 
    if (accuracy > 0) {
        
        if (accuracy >= global.solutionCeiling) //if accuracy has exceeded solutionCeiling, then we can skip everything and return the solutionvalue
        {
            return solutionValue;
        }

        if (global.solutionCeiling - accuracy >= solutionValue) { //if we can take off enough from the ceiling, do so
            return returnRandomInteger(global.solutionFloor, global.solutionCeiling - accuracy);
        }
        else if (global.solutionFloor + accuracy <= solutionValue) { //if we couldn't take from the ceiling, add to the floor
            return returnRandomInteger(global.solutionFloor + accuracy, global.solutionCeiling)
        }
        else { //if we couldn't do either of those things, we need to split accuracy between floor & ceiling
            if (global.solutionCeiling - accuracy < solutionValue) { //if we can't take enough off the top, then
                let _difference = global.solutionCeiling - accuracy; //calculate the difference - Math.abs to convert it into a positive int
                if (global.solutionFloor + _difference <= solutionValue) { //********** redundant ?
                    return returnRandomInteger(global.solutionFloor + _difference, solutionValue);
                }
            }
            else if (global.solutionFloor + accuracy > solutionValue) { //if we couldn't take enough off the top, then bottom, then try the other way, starting with the floor instead
                let _difference = global.solutionFloor + accuracy; //calculate the difference
                if (global.solutionCeiling - _difference >= solutionValue) {
                    return returnRandomInteger(solutionValue, global.solutionCeiling - _difference);
                }
            }
            else { //shouldn't be possible to reach here
                console.log("Shouldn't be possible to get here: err1");
                return solutionValue;
            }
        }
    }

    else { //if accuracy is 0, then return a random value
        return returnRandomInteger(global.solutionFloor, global.solutionCeiling);
    }
}

function returnSkillNameOrNumber(skill) { //basically an enum - if i give it the name, it returns the number, if i give it the number, it returns the name
    if (Number.isNaN(skill) == false) {
        switch (skill) {
            case 0:
                return "accuracy";
            case 1:
                return "locking";
            case 2:
                return "critguess";
            case 3:
                return "critsolve";
        }
    }
    else {
        switch (skill) {
            case "accuracy":
                return 0;
            case "locking":
                return 1;
            case "critguess":
                return 2;
            case "critsolve":
                return 3;
        }
    }
}

function growthCurve(model, currentValue) {
    switch (model) {
        case "superlinear": 
            return Math.round(Math.pow(currentValue, 1.1));
        case "quadratic":
            return (Math.pow(currentValue, 2)).toFixed(2);
        case "log": //logmarithic growth, the inverse of exponentional
            return (Math.log(currentValue)).toFixed(2);
        case "sublinear": //slower than linear growth - used for the solution complexity multiplier
            return Math.ceil(Math.sqrt(currentValue)); //rounds UP
    }
}
