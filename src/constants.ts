export const DISTRICTS = [
  'ALBURQUERQUE', 'ALICIA', 'ANDA', 'ANTEQUERA', 'BACLAYON', 'BALILIHAN', 'BATUAN', 'BIEN UNIDO', 'BILAR', 'BUENAVISTA', 'CALAPE', 'CANDIJAY', 'CARMEN 1', 'CARMEN 2', 'CATIGBIAN', 'CLARIN', 'CORELLA', 'CORTES', 'DAGOHOY', 'DANAO', 'DAUIS', 'DIMIAO', 'DUERO', 'GARCIA HERNANDEZ', 'GETAFE', 'GUINDULMAN', 'INABANGA NORTH', 'INABANGA SOUTH', 'JAGNA', 'LINTAON', 'LILA', 'LOAY', 'LOBOC', 'LOON NORTH', 'LOON SOUTH', 'MABINI', 'MARIBOJOC', 'PANGLAO', 'PILAR', 'PRES. CARLOS P. GARCIA', 'SAGBAYAN', 'SAN ISIDRO', 'SAN MIGUEL', 'SEVILLA', 'SIERRA BULLONES', 'SIKATUNA', 'TALIBON 1', 'TALIBON 2', 'TRINIDAD', 'TUBIGON EAST', 'TUBIGON WEST', 'UBAY 1', 'UBAY 2', 'UBAY 3', 'VALENCIA'
];

export const GRADES = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
];

export const REASONS = [
  'Distance', 'Work', 'Health', 'Family Problems', 'Others'
];

export const ACADEMIC_STATUSES = [
  '(90-100) Outstanding',
  '(85-89) Very Satisfactory',
  '(80-84) Satisfactory',
  '(75-79) Fairly Satisfactory',
  '(Below 75) Did not meet expectations'
];

export const ASSESSMENTS = [
  'Pending',
  'Continue ADM',
  'Back to Regular Class'
];

export const DISTRICTS_BY_CD: Record<string, string[]> = {
  'CD1': ['ALBURQUERQUE', 'ANTEQUERA', 'BACLAYON', 'BALILIHAN', 'CALAPE', 'CATIGBIAN', 'CORELLA', 'CORTES', 'DAUIS', 'LOON NORTH', 'LOON SOUTH', 'MARIBOJOC', 'PANGLAO', 'SIKATUNA', 'TUBIGON EAST', 'TUBIGON WEST'],
  'CD2': ['BIEN UNIDO', 'BUENAVISTA', 'CLARIN', 'DAGOHOY', 'DANAO', 'GETAFE', 'INABANGA NORTH', 'INABANGA SOUTH', 'PRES. CARLOS P. GARCIA', 'SAGBAYAN', 'SAN ISIDRO', 'SAN MIGUEL', 'TALIBON 1', 'TALIBON 2', 'TRINIDAD', 'UBAY 1', 'UBAY 2', 'UBAY 3'],
  'CD3': ['ALICIA', 'ANDA', 'BATUAN', 'BILAR', 'CANDIJAY', 'CARMEN 1', 'CARMEN 2', 'DIMIAO', 'DUERO', 'GARCIA HERNANDEZ', 'GUINDULMAN', 'JAGNA', 'LILA', 'LOAY', 'LOBOC', 'MABINI', 'PILAR', 'SEVILLA', 'SIERRA BULLONES', 'VALENCIA']
};

export const SCHOOLS_BY_DISTRICT: Record<string, string[]> = {
  'ALBURQUERQUE': ['Alburquerque National High School'],
  'ALICIA': ['Alicia National High School'],
  'ANDA': ['Anda National High School'],
  'ANTEQUERA': ['Antequera National High School'],
  'BACLAYON': ['Baclayon National High School'],
  'BALILIHAN': ['Balilihan National High School'],
  'BATUAN': ['Batuan National High School'],
  'BIEN UNIDO': ['Bien Unido National High School'],
  'BILAR': ['Bilar National High School'],
  'BUENAVISTA': ['Buenavista National High School'],
  'CALAPE': ['Calape National High School'],
  'CANDIJAY': ['Candijay National High School'],
  'CARMEN 1': ['Carmen National High School'],
  'CARMEN 2': ['Cong. Simeon G. Toribio National High School'],
  'CATIGBIAN': ['Catigbian National High School'],
  'CLARIN': ['Clarin National High School'],
  'CORELLA': ['Corella National High School'],
  'CORTES': ['Cortes National High School'],
  'DAGOHOY': ['Dagohoy National High School'],
  'DANAO': ['Danao National High School'],
  'DAUIS': ['Dauis National High School'],
  'DIMIAO': ['Dimiao National High School'],
  'DUERO': ['Duero National High School'],
  'GARCIA HERNANDEZ': ['Garcia Hernandez National High School'],
  'GETAFE': ['Getafe National High School'],
  'GUINDULMAN': ['Guindulman National High School'],
  'INABANGA NORTH': ['Inabanga North National High School'],
  'INABANGA SOUTH': ['Inabanga South National High School'],
  'JAGNA': ['Jagna National High School'],
  'LILA': ['Lila National High School'],
  'LOAY': ['Loay National High School'],
  'LOBOC': ['Loboc National High School'],
  'LOON NORTH': ['Loon North National High School'],
  'LOON SOUTH': ['Loon South National High School'],
  'MABINI': ['Mabini National High School'],
  'MARIBOJOC': ['Maribojoc National High School'],
  'PANGLAO': ['Panglao National High School'],
  'PILAR': ['Pilar National High School'],
  'PRES. CARLOS P. GARCIA': ['Pres. Carlos P. Garcia National High School'],
  'SAGBAYAN': ['Sagbayan National High School'],
  'SAN ISIDRO': ['San Isidro National High School'],
  'SAN MIGUEL': ['San Miguel National High School'],
  'SEVILLA': ['Sevilla National High School'],
  'SIERRA BULLONES': ['Sierra Bullones National High School'],
  'SIKATUNA': ['Sikatuna National High School'],
  'TALIBON 1': ['Talibon 1 National High School'],
  'TALIBON 2': ['Talibon 2 National High School'],
  'TRINIDAD': ['Trinidad National High School'],
  'TUBIGON EAST': ['Tubigon East National High School'],
  'TUBIGON WEST': ['Tubigon West National High School'],
  'UBAY 1': ['Ubay 1 National High School'],
  'UBAY 2': ['Ubay 2 National High School'],
  'UBAY 3': ['Ubay 3 National High School'],
  'VALENCIA': ['Valencia National High School']
};
