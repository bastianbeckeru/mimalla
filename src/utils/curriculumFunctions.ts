import type {
  EnrollmentProps,
  GradeProps,
  PeriodProps,
  SubgradeProps,
} from "@/types/user";

export function subgradeAverage(subgrades: SubgradeProps[]) {
  if (!subgrades || subgrades.length === 0) return 0;

  let sumValues = 0;
  const validGrades = subgrades.filter(
    (subgrade) => subgrade.value && !subgrade.excluded,
  );

  if (validGrades.length === 0) return 0;

  validGrades.forEach((subgrade) => {
    sumValues += subgrade.value ?? 0;
  });

  return sumValues / validGrades.length;
}

export function gradeAverage(grades: GradeProps[]) {
  if (!grades || grades.length === 0) return 0;

  let totalAverage = 0;
  let totalPercentage = 0;

  grades.forEach((grade) => {
    if (grade.value && grade.weight && !grade.excluded) {
      totalAverage += grade.value * (grade.weight / 100);
      totalPercentage += grade.weight / 100;
    }
  });

  if (totalPercentage == 0) return 0;
  return totalAverage / totalPercentage;
}

export function courseAverage(enrollments: EnrollmentProps[]) {
  if (enrollments.length === 0) return 0;

  let totalAverage = 0;
  let enrollmentCount = 0;

  enrollments.forEach((enrollment) => {
    const average = gradeAverage(enrollment.grades);
    if (average > 0) {
      totalAverage += average;
      enrollmentCount++;
    }
  });

  if (enrollmentCount == 0) return 0;
  return totalAverage / enrollmentCount;
}

export function periodAverage(periods: PeriodProps[]) {
  if (periods.length === 0) return 0;

  let totalAverage = 0;
  let periodCount = 0;

  periods.forEach((period) => {
    const average = courseAverage(period.enrollments);
    if (average > 0) {
      totalAverage += average;
      periodCount++;
    }
  });

  if (periodCount == 0) return 0;
  return totalAverage / periodCount;
}
