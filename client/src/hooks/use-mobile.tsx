import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // נגדיר ערך התחלתי מדויק יותר שיתבסס על רוחב המסך
  // אם התצוגה צרה מהנקודת-שבירה שלנו, זהו מכשיר מובייל
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // בדיקה אם אנחנו בדפדפן
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false; // ברירת מחדל לרינדור בצד שרת
  });

  React.useEffect(() => {
    // איתחול מצב ההתחלה בצורה מיידית
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // הגדרת האזנה לשינויי גודל המסך
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // פונקציה לטיפול בשינויי גודל
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    }
    
    // התמודדות עם דפדפנים ותיקים וחדשים
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else {
      // תמיכה בגרסאות דפדפן ישנות יותר
      window.addEventListener('resize', onChange);
    }
    
    // ניקוי האזנה בעת סגירת הקומפוננטה
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else {
        window.removeEventListener('resize', onChange);
      }
    }
  }, []);

  return isMobile;
}
