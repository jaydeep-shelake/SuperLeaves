function convertISTtoUTC(istTime) {
    let time = new Date('2023-02-01 '+ istTime);
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
    
    let offset = 330; // IST is 330 minutes ahead of UTC
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


  function dateConverter(date){
    const offset = 330;  // IST offset is 5 hours and 30 minutes ahead of UTC
    const ISTTime = new Date(date.getTime() + offset * 60 * 1000);
    const todaysDate = ISTTime.toISOString();
    return todaysDate
  }
  function convertISTtoServerTime (istTime) {
    const serverTime = new Date()
    const serverOffset = serverTime.getTimezoneOffset()
  
    const istOffset = 330 // IST is 330 minutes ahead of UTC
    const offsetHours = Math.floor((istOffset + serverOffset) / 60)
    const offsetMinutes = (istOffset + serverOffset) % 60
  
    const parts = istTime.trim().split(/\s+/)
    let hours = parseInt(parts[0].split(":")[0], 10)
    let minutes = parseInt(parts[0].split(":")[1], 10)
    let ampm = parts[1]
    if (ampm === 'PM') {
      hours = hours !== 12 ? hours + 12 - offsetHours : hours - offsetHours
    } else if (ampm === 'AM') {
      hours = hours === 12 ? hours - 12 - offsetHours : hours - offsetHours
    }
    minutes -= offsetMinutes
    if (minutes < 0) {
      minutes += 60
      hours -= 1
    }
    serverTime.setHours(hours)
    serverTime.setMinutes(minutes)
  
    const formatter = new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric'
    })
  
    return formatter.format(serverTime)
  }
  module.exports={convertISTtoUTC,getTimeComparison,dateConverter,convertISTtoServerTime}