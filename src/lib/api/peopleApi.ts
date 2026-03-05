import { api } from "./client";

export interface Person {
    id: string;
    fullName: string;
    email?: string | null;
    phone?: string | null;
}

export interface CreatePersonDto {
    fullName: string;
    email?: string;
    phone?: string;
}

export const peopleApi = {
    createPerson: (data: CreatePersonDto) => api.post<Person>("/people", data),
    getPeople: () => api.get<Person[]>("/people"),
};
