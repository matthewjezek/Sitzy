/**
 * Simple rule-based Czech vocative (vokativ) declension for first names.
 * Designed for common Czech names used in greetings.
 */
export function getCzechVocative(name: string): string {
  if (!name) return '';
  
  const lowerName = name.toLowerCase();
  const lastChar = lowerName.slice(-1);
  const lastTwo = lowerName.slice(-2);
  
  // Rule: Ends with -a (Eliška, Jana) -> -o (Eliško, Jano)
  if (lastChar === 'a') {
    return name.slice(0, -1) + 'o';
  }
  
  // Rule: Ends with -u (Lulu) or -o (Oto, Bruno) -> stays (Lulu, Oto, Bruno)
  if (lastChar === 'u' || lastChar === 'o') {
    return name;
  }

  // Rule: Ends with -e, -ě, -i, -í (Marie, Jiří) -> stays
  if (['e', 'ě', 'i', 'í'].includes(lastChar)) {
    return name;
  }
  
  // Rule: Consonants
  // Hard/Neutral consonants usually take -e or -u
  // -k, -g, -h, -ch -> -u (Marek -> Marku, Oleg -> Olegu, Filip -> Filipe?)
  if (['k', 'g', 'h'].includes(lastChar) || lastTwo === 'ch') {
    return name + 'u';
  }
  
  // Soft consonants -> -i (Miloš -> Miloši, Tomáš -> Tomáši, Matěj -> Matěji)
  if (['š', 'ž', 'č', 'ř', 'c', 'j'].includes(lastChar)) {
    return name + 'i';
  }
  
  // -r -> -ře (Petr -> Petře)
  if (lastChar === 'r') {
    return name.slice(0, -1) + 'ře';
  }

  // Default for other consonants (hard/neutral) -> -e (Jan -> Jane, Filip -> Filipe, David -> Davide)
  return name + 'e';
}
