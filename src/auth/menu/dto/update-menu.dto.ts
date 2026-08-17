// Hereda directamente de CreateMenuDto, por lo que exige todos los campos
// obligatorios igual que un alta. Para admitir actualizaciones parciales
// habría que usar PartialType(CreateMenuDto) de '@nestjs/swagger'.
import { CreateMenuDto } from './create-menu.dto';

export class UpdateMenuDto extends CreateMenuDto {}
