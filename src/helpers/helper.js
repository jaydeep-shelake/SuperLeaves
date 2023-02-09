// function to retrun difference of days between two dates
function getDaysDiff(dateTo,dateFrom){
    const diffTime = Math.abs(dateTo - dateFrom);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays
}

function splitTimeString(time){
    const parts = time.trim().split(/\s+/)
    let hours = parseInt(parts[0].split(":")[0], 10)
    let minutes = parseInt(parts[0].split(":")[1], 10)
    let ampm = parts[1]
    return {hours,minutes,ampm}
}

function substractStandupTime(minToMinus,time){
    const  standupTime = time
    
    let date = new Date("01/01/2000 " + standupTime);
     date.setMinutes(date.getMinutes() - minToMinus);
   
     let hours = date.getHours();
     let minutes = date.getMinutes();
     let ampm = hours >= 12 ? 'PM' : 'AM';
     hours = hours % 12;
     hours = hours ? hours : 12;
     minutes = minutes < 10 ? '0' + minutes : minutes;
    
     return hours + ':' + minutes + ' ' + ampm
    }
module.exports={
    getDaysDiff,
    substractStandupTime,
    splitTimeString
}
