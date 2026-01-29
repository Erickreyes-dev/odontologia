

export interface Employee {
  id: string;
  identidad: string;

  nombre: string;
  apellido: string;
  correo: string;

  fechaNacimiento: Date;
  fechaIngreso: Date;

  telefono: string;


  vacaciones: number;
  genero: string;
  activo: boolean;

  usuario_id: string;
  usuario: string;

  puesto_id: string;
  puesto: string;

  createAt: Date;
  updateAt: Date;
}
