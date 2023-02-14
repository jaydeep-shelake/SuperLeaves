const getWeek = (currentDate) => {
    const startDate = new Date(currentDate.getFullYear(), 0, 1)
    const diff = currentDate - startDate
    const oneDay = 1000 * 60 * 60 * 24
    const days = Math.floor(diff / oneDay)
    const week = Math.ceil((days + startDate.getDay() + 1) / 7)
    return week
  }

  const getOrderKey = (extraWeeks = 0) => {
    const currentTime = new Date()
    const refTime = currentTime.getDate() + (extraWeeks * 7)
    const refDate = new Date(currentTime.setDate(refTime))
    const year = refDate.getFullYear()
    const week = getWeek(refDate)
    return `${year}_${week+1}`  // get next week
  }

  module.exports={
    getOrderKey
  }