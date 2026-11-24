import type { Curriculum } from "@/types/curriculum";
import type { Trajectory } from "@/types/trajectory";
import { exportTrajectory } from "@/utils/trajectory-file/export";
import { writeWorkbook } from "@/utils/trajectory-file/workbook";

const XLSX_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function getFileName({ curriculumPath }: Trajectory) {
  const [, program, effectiveYear] = curriculumPath.split("/");
  const date = new Date().toISOString().slice(0, 10);
  return `mimalla-${program}-${effectiveYear}-${date}.xlsx`;
}

export async function downloadTrajectory(
  trajectory: Trajectory,
  curriculum: Curriculum,
) {
  const data = await writeWorkbook(exportTrajectory(trajectory, curriculum));
  const url = URL.createObjectURL(new Blob([data], { type: XLSX_TYPE }));
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileName(trajectory);
  link.click();
  URL.revokeObjectURL(url);
}
