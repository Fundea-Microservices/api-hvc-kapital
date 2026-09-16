import { CreateConfigDto } from './create-config.dto';

// Siguiendo el patrón del proyecto (como menu), Update hereda de Create, así
// que exige todos los campos obligatorios igual que un alta. Para admitir
// actualizaciones parciales habría que usar PartialType de '@nestjs/swagger'.
export class UpdateConfigDto extends CreateConfigDto {}
