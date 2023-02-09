// function to retrun difference of days between two dates
function getDaysDiff(dateTo,dateFrom){
    const diffTime = Math.abs(dateTo - dateFrom);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays
}

module.exports={
    getDaysDiff
}
