import { prisma } from "../lib/prisma";
import { notFound } from "../lib/httpError";

export interface PersonCreateInput {
  surname: string;
  firstname: string;
  othername?: string | null;
  nationalityId?: number | null;
  countryId?: number | null;
  districtId?: number | null;
  countyId?: number | null;
  residenceCountryId?: number | null;
  residenceDistrictId?: number | null;
  residenceCountyId?: number | null;
}

export interface PersonFilter {
  search?: string;
  page?: number;
  limit?: number;
}

export class PersonService {
  static async list(filter: PersonFilter = {}) {
    const { search, page = 1, limit = 50 } = filter;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstname: { contains: search } },
            { surname: { contains: search } },
            { othername: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await prisma.$transaction([
      prisma.person.findMany({
        where,
        skip,
        take: limit,
        orderBy: { surname: "asc" },
        include: {
          contacts: true,
          demographics: true,
          positions: {
            include: { position: true },
          },
        },
      }),
      prisma.person.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: number) {
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        contacts: true,
        demographics: true,
        ids: true,
        languages: true,
        competencies: true,
        positions: {
          include: { position: { include: { job: true, facility: true, department: true } } },
        },
        salaries: { orderBy: { startDate: "desc" } },
        employments: true,
        educations: true,
        benefits: true,
        notes: true,
      },
    });

    if (!person) {
      throw notFound("Person not found");
    }

    return person;
  }

  static async create(data: PersonCreateInput) {
    return prisma.person.create({
      data: {
        surname: data.surname,
        firstname: data.firstname,
        othername: data.othername ?? null,
        nationalityId: data.nationalityId ?? null,
        countryId: data.countryId ?? null,
        districtId: data.districtId ?? null,
        countyId: data.countyId ?? null,
        residenceCountryId: data.residenceCountryId ?? null,
        residenceDistrictId: data.residenceDistrictId ?? null,
        residenceCountyId: data.residenceCountyId ?? null,
      },
    });
  }

  static async update(id: number, data: Partial<PersonCreateInput>) {
    const existing = await prisma.person.findUnique({ where: { id } });
    if (!existing) {
      throw notFound("Person not found");
    }

    return prisma.person.update({
      where: { id },
      data: {
        ...(data.surname !== undefined && { surname: data.surname }),
        ...(data.firstname !== undefined && { firstname: data.firstname }),
        ...(data.othername !== undefined && { othername: data.othername }),
        ...(data.nationalityId !== undefined && { nationalityId: data.nationalityId }),
        ...(data.countryId !== undefined && { countryId: data.countryId }),
        ...(data.districtId !== undefined && { districtId: data.districtId }),
        ...(data.countyId !== undefined && { countyId: data.countyId }),
        ...(data.residenceCountryId !== undefined && { residenceCountryId: data.residenceCountryId }),
        ...(data.residenceDistrictId !== undefined && { residenceDistrictId: data.residenceDistrictId }),
        ...(data.residenceCountyId !== undefined && { residenceCountyId: data.residenceCountyId }),
      },
    });
  }

  static async delete(id: number) {
    const existing = await prisma.person.findUnique({ where: { id } });
    if (!existing) {
      throw notFound("Person not found");
    }

    return prisma.person.delete({ where: { id } });
  }
}
