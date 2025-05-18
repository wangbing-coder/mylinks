/**
 * Calculate age from birthdate to current date or specified date
 * @param birthDate Birth date
 * @param toDate Date to calculate age to (defaults to current date)
 * @returns Object with age in different formats
 */
export function calculateAge(birthDate: Date, toDate: Date = new Date()) {
  // Validate dates
  if (birthDate > toDate) {
    throw new Error("Birth date cannot be in the future");
  }

  // Calculate years
  let years = toDate.getFullYear() - birthDate.getFullYear();
  
  // Adjust years if the current month/day is before birth month/day
  const birthMonth = birthDate.getMonth();
  const currentMonth = toDate.getMonth();
  
  if (currentMonth < birthMonth || 
      (currentMonth === birthMonth && toDate.getDate() < birthDate.getDate())) {
    years--;
  }
  
  // Calculate months
  let months = toDate.getMonth() - birthDate.getMonth();
  if (months < 0) months += 12;
  
  // Adjust for day of month
  if (toDate.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) months += 12;
  }
  
  // Calculate days
  let days = toDate.getDate() - birthDate.getDate();
  if (days < 0) {
    // Get the number of days in the previous month
    const lastMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  // Calculate total values
  const totalDays = Math.floor((toDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalMonths = years * 12 + months;
  
  // Calculate hours, minutes, seconds
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const remainingMilliseconds = (toDate.getTime() - birthDate.getTime()) % millisecondsInDay;
  
  const hours = Math.floor(remainingMilliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMilliseconds % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingMilliseconds % (60 * 1000)) / 1000);
  
  // Calculate decimal age (years with decimal)
  const decimalAge = totalDays / 365.25;
  
  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalMonths,
    decimalAge: parseFloat(decimalAge.toFixed(2)),
    formatted: {
      full: `${years} years, ${months} months, ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`,
      short: `${years}y ${months}m ${days}d`,
      ymd: `${years} years, ${months} months, ${days} days`,
      decimal: `${decimalAge.toFixed(2)} years`
    }
  };
}

/**
 * Get next birthday information
 * @param birthDate Birth date
 * @returns Object with next birthday information
 */
export function getNextBirthday(birthDate: Date) {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  // Create date for this year's birthday
  const thisBirthday = new Date(
    currentYear,
    birthDate.getMonth(),
    birthDate.getDate()
  );
  
  // If this year's birthday has passed, use next year
  if (today > thisBirthday) {
    thisBirthday.setFullYear(currentYear + 1);
  }
  
  // Calculate days until next birthday
  const daysUntil = Math.ceil((thisBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate age on next birthday
  const nextAge = thisBirthday.getFullYear() - birthDate.getFullYear();
  
  return {
    date: thisBirthday,
    daysUntil,
    nextAge
  };
}
