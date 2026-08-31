import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Usuario } from 'database/entities/usuario.entity';
import { getCategoryConfig } from '../config/category.config';

@Injectable()
export class EntityUpdaterService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async updateEntityUrl(options: {
    categoria: string;
    entityId: string;
    fileUrl: string;
    fieldName?: string;
  }): Promise<void> {
    const { categoria, entityId, fileUrl, fieldName } = options;
    const config = getCategoryConfig(categoria);

    if (!config?.entityRelation) return;

    switch (config.entityRelation.entity) {
      case 'Usuario':
        const user = await this.usuarioRepository.findOne({
          where: { id: entityId },
        });
        if (user) {
          user.fotoUrl = fileUrl;
          await this.usuarioRepository.save(user);
        }
        break;

      // case 'Producto':
      //   const product = await this.productoRepository.findOne({
      //     where: { id: entityId },
      //   });
      //   if (product) {
      //     const field = fieldName || 'fotoUrl';
      //     product[field] = fileUrl;
      //     await this.productoRepository.save(product);
      //   }
      //   break;
    }
  }
}
