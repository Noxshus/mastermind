var data = {
    playerguess: [0, 0, 0],
    solution: [0, 0, 0],
    solutionlength: 3, //number of integers in the solution
    solutionceiling: 3, //the max value a solution integer can have
    solutionfloor: 0 //the min value a solution integer can have
};

function guess(num)
{
    document.getElementById(num).innerHTML = returnRandomInteger(data.solutionfloor, data.solutionceiling);
}

function returnRandomInteger(min, max) //returns a random integer, min & max included
{
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}