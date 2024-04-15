import { type TaskProps } from "@/stores/curriculum";

export function taskFilter(taskQueue: TaskProps[]) {
  if (taskQueue.length <= 1) return taskQueue;

  let filteredTaskQueue = [...taskQueue];
  const tasksToDelete: number[] = [];

  // Filter 1 - Filtra las tareas create/update y compacta las tareas update.
  filteredTaskQueue = filteredTaskQueue.filter((task) => {
    // Filtra las tareas create/update debido a que existe una tarea delete.
    if (
      !task.action.includes("delete") &&
      filteredTaskQueue.some(
        (taskX) =>
          taskX.action.includes("delete") &&
          (taskX.data.id === task.data.id ||
            taskX.data.id === task.data.parentGradeId),
      )
    ) {
      if (task.action.includes("create")) {
        tasksToDelete.push(task.data.id);
      }
      return false;
    }
    // Filtra todas las tareas update que son más antiguas.
    else if (
      task.action.includes("update") &&
      filteredTaskQueue.some(
        (taskX) =>
          taskX.action.includes("update") &&
          taskX.data.id === task.data.id &&
          taskX.timestamp > task.timestamp,
      )
    ) {
      return false;
    }
    return true;
  });

  // Filter 2 - Filtra las tareas update que tienen una tarea create asociada y borra las tareas delete innecesarias.
  filteredTaskQueue = filteredTaskQueue.filter((task) => {
    if (
      task.action.includes("update") &&
      filteredTaskQueue.some(
        (taskX) =>
          taskX.action.includes("create") && taskX.data.id === task.data.id,
      )
    ) {
      filteredTaskQueue.forEach((taskX) => {
        if (taskX.action.includes("create") && taskX.data.id === task.data.id) {
          taskX.data = task.data;
        }
      });

      return false;
    } else if (tasksToDelete.includes(task.data.id)) {
      return false;
    }
    return true;
  });

  // Filter 3 - Filtra las tareas createSubgrade anidandolas en createGrade.
  filteredTaskQueue = filteredTaskQueue.filter((task) => {
    if (
      task.action.includes("create") &&
      filteredTaskQueue.some(
        (taskX) =>
          taskX.action.includes("create") &&
          taskX.data.id === task.data.parentGradeId,
      )
    ) {
      filteredTaskQueue.forEach((taskX) => {
        if (
          taskX.action.includes("create") &&
          taskX.data.id === task.data.parentGradeId
        ) {
          if (taskX.data.subgrades === undefined) {
            taskX.data.subgrades = [];
          }

          taskX.data.subgrades.push({
            name: task.data.name,
            value: task.data.value,
            excluded: task.data.excluded ?? false,
          });
        }
      });

      return false;
    }
    return true;
  });

  return filteredTaskQueue;
}

export function splitTasks(taskQueue: TaskProps[]) {
  const createGradeTasks: CreateGradeData[] = [];
  const updateGradeTasks: UpdateGradeData[] = [];
  const deleteGradeTasks: number[] = [];

  taskQueue.forEach((task) => {
    if (task.action === "createGrade") {
      createGradeTasks.push({
        name: task.data.name,
        value: task.data.value!,
        weight: task.data.weight!,
        subgrades: task.data.subgrades,
        enrollmentId: task.data.enrollmentId!,
        parentGradeId: task.data.parentGradeId,
      });
    } else if (task.action === "updateGrade") {
      updateGradeTasks.push({
        id: task.data.id,
        name: task.data.name,
        value: task.data.value!,
        weight: task.data.weight!,
        excluded: task.data.excluded!,
        parentGradeId: task.data.parentGradeId,
      });
    } else if (task.action === "deleteGrade") {
      deleteGradeTasks.push(task.data.id);
    }
  });

  return {
    create: createGradeTasks,
    update: updateGradeTasks,
    delete: deleteGradeTasks,
  };
}

export type CreateGradeData = {
  name: string;
  value: number;
  weight: number;
  subgrades?: {
    name: string;
    value?: number | null;
    excluded: boolean;
  }[];
  enrollmentId: number;
  parentGradeId?: number;
};

export type UpdateGradeData = {
  id: number;
  name: string;
  value: number;
  weight: number;
  excluded: boolean;
  parentGradeId?: number;
};
