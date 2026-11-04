import { prisma } from "../lib/prisma";

export interface TrainingCourseCreateInput {
  name: string;
  topic?: string | null;
  notes?: string | null;
  trainingInstitutionId?: number | null;
  trainingFunder?: string | null;
  continuingEducationCourse?: string | null;
  trainingCourseStatusId?: number | null;
  trainingCourseCategoryId?: number | null;
  competency?: string | null;
}

export class TrainingService {
  static async listCourses() {
    return prisma.trainingCourse.findMany({
      include: {
        trainingInstitution: true,
        scheduledCourses: {
          include: {
            personScheduled: {
              include: { person: true },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  static async createCourse(data: TrainingCourseCreateInput) {
    return prisma.trainingCourse.create({
      data: {
        name: data.name,
        topic: data.topic ?? null,
        notes: data.notes ?? null,
        trainingInstitutionId: data.trainingInstitutionId ?? null,
        trainingFunder: data.trainingFunder ?? null,
        continuingEducationCourse: data.continuingEducationCourse ?? null,
        trainingCourseStatusId: data.trainingCourseStatusId ?? null,
        trainingCourseCategoryId: data.trainingCourseCategoryId ?? null,
        competency: data.competency ?? null,
      },
    });
  }

  static async listInstitutions() {
    return prisma.trainingInstitution.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async createInstitution(name: string) {
    return prisma.trainingInstitution.create({ data: { name } });
  }

  static async listStatuses() {
    return prisma.trainingCourseStatus.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async listCategories() {
    return prisma.trainingCourseCategory.findMany({
      orderBy: { name: "asc" },
    });
  }
}
