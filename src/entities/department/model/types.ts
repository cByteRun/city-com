export const departments = [
  "ЖКХ",
  "Дороги и транспорт",
  "Благоустройство",
  "Образование",
  "Здравоохранение",
  "Экология",
  "Безопасность и порядок",
  "Социальная защита",
  "Культура",
  "Предпринимательство",
  "Другое",
] as const;
export const districts = [
  "Центральный",
  "Северный",
  "Южный",
  "Восточный",
  "Промышленный",
  "Усольский",
];
export interface Department {
  id: string;
  name: string;
  topics: string;
  responsible: string;
}
