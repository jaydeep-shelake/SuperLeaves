function convertISTtoUTC(istTime) {
    let time = new Date();
    let parts = istTime.split(/\s+/);
    let hours = parseInt(parts[0].split(":")[0], 10);
    let minutes = parseInt(parts[0].split(":")[1], 10);
    let ampm = parts[1];
    if (ampm === "PM" && hours !== 12) {
      hours += 12;
    }
    if (ampm === "AM" && hours === 12) {
      hours = 0;
    }
    time.setHours(hours);
    time.setMinutes(minutes);
    
    let offset = 329; // IST is 330 minutes ahead of UTC
    let utcTime = new Date((time.getTime()+ (1000 * 60)) - offset );
    
    let utcHours = utcTime.getUTCHours();
    let utcMinutes = utcTime.getUTCMinutes();
    let utcTimeString = `${utcHours}:${utcMinutes=="1"?'0':utcMinutes} `;
    
    return utcTimeString;
  }

  function getTimeComparison(date1,date2){
    // return true if 
    //12:30 < 1:30
    if (date1.getTime() < date2.getTime()) {
      return false
    } else {
      return true
    }
  }
  
  module.exports={convertISTtoUTC,getTimeComparison}