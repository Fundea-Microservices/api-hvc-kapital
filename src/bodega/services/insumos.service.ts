import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Insumo } from 'database/entities/bodega/insumo.entity';
import { BaseService } from 'src/common';
import { CreateInsumoDto, PaginationInsumoDto, UpdateInsumoDto } from '../dto/insumo.dto';

@Injectable()
export class InsumosService extends BaseService {
  constructor(
    @Inject('INSUMO_REPOSITORY')
    private readonly insumoRepository: Repository<Insumo>,
  ) {
    super();
  }

  protected readonly logger = new Logger('InsumosService');

  async create(createDto: CreateInsumoDto) {
    try {
      const insumo = this.insumoRepository.create(createDto);
      const saved = await this.insumoRepository.save(insumo);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Insumo creado exitosamente',
        'bodega/insumos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-20', 'Error al crear insumo');
    }
  }

  async findAll(paginationDto: PaginationInsumoDto) {
    try {
      const { page, limit, busqueda, estado } = paginationDto;

      const qb = this.insumoRepository
        .createQueryBuilder('insumo')
        .leftJoinAndSelect('insumo.categoria', 'categoria')
        .orderBy('insumo.nombre', 'ASC')
        .skip((page - 1) * limit)
        .take(limit);

      if (busqueda) {
        qb.andWhere('insumo.nombre LIKE :busqueda', { busqueda: `%${busqueda}%` });
      }

      if (estado === 1) {
        // Alerta Roja: cantidad_actual <= punto_minimo
        qb.andWhere('insumo.cantidad_actual <= insumo.punto_minimo');
      } else if (estado === 2) {
        // Alerta Amarilla: cantidad_actual > punto_minimo AND cantidad_actual <= punto_medio
        qb.andWhere('insumo.cantidad_actual > insumo.punto_minimo')
          .andWhere('insumo.cantidad_actual <= insumo.punto_medio');
      } else if (estado === 3) {
        // Sin alerta: cantidad_actual > punto_medio
        qb.andWhere('insumo.cantidad_actual > insumo.punto_medio');
      }

      const [data, total] = await qb.getManyAndCount();

      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Insumos listados correctamente',
        'bodega/insumos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-21', 'Error al listar insumos');
    }
  }

  async findOne(id: string) {
    try {
      const data = await this.insumoRepository.findOne({
        where: { id },
        relations: ['categoria'],
      });
      if (!data) {
        return this.customThrowError(null, 'BOD-22-01', `Insumo con ID ${id} no encontrado`);
      }
      return this.customSuccessResponse(
        data,
        null,
        HttpStatus.OK,
        'Insumo encontrado',
        'bodega/insumos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-22', 'Error al buscar insumo');
    }
  }

  async update(id: string, updateDto: UpdateInsumoDto) {
    try {
      const exists = await this.insumoRepository.findOneBy({ id });
      if (!exists) {
        return this.customThrowError(null, 'BOD-23-01', `Insumo con ID ${id} no encontrado`);
      }
      await this.insumoRepository.update(id, updateDto);
      const updated = await this.insumoRepository.findOne({
        where: { id },
        relations: ['categoria'],
      });
      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Insumo actualizado correctamente',
        'bodega/insumos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-23', 'Error al actualizar insumo');
    }
  }

  async remove(id: string) {
    try {
      const exists = await this.insumoRepository.findOneBy({ id });
      if (!exists) {
        return this.customThrowError(null, 'BOD-24-01', `Insumo con ID ${id} no encontrado`);
      }
      await this.insumoRepository.delete(id);
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Insumo eliminado exitosamente',
        'bodega/insumos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-24', 'Error al eliminar insumo');
    }
  }
}
