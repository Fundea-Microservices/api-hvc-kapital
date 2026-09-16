// Ojo: a diferencia de UpdateAccesoDto, esta clase hereda directamente de
// CreateApikeyDto, por lo que exige TODOS los campos obligatorios igual que un
// alta. Se conserva el comportamiento actual y así queda reflejado en /v1/docs.
// Para admitir actualizaciones parciales habría que usar
// PartialType(CreateApikeyDto) de '@nestjs/swagger'.
import { CreateApikeyDto } from './create-apikey.dto';

export class UpdateApikeyDto extends CreateApikeyDto {}
