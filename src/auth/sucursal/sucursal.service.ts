import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { Sucursal } from 'database/entities/sucursal.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateSucursalDto, UpdateSucursalDto } from './dto/sucursal.dto';

@Injectable()
export class SucursalService extends BaseService {
  constructor(
    @Inject('SUCURSAL_REPOSITORY')
    private readonly sucursalRepository: Repository<Sucursal>,
  ) {
    super();
  }

  protected readonly logger = new Logger('SucursalService');

  // AUT-50
  async create(createDto: CreateSucursalDto) {
    try {
      createDto.municipio = createDto.municipio.toUpperCase();
      createDto.departamento = createDto.departamento.toUpperCase();
      const sucursal = this.sucursalRepository.create(createDto);
      const saved = await this.sucursalRepository.save(sucursal);
      return this.customSuccessResponse(
        saved,
        null,
        HttpStatus.CREATED,
        'Sucursal creada exitosamente',
        'auth/sucursal',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-50', 'Error al crear sucursal');
    }
  }

  // AUT-51
  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit, busqueda, todos } = paginationDto;

      if (todos) {
        const [data, total] = await this.sucursalRepository.findAndCount({
          order: { nombre: 'ASC' },
        });
        return this.customSuccessResponse(
          data,
          { total, page: 1, limit: total },
          HttpStatus.OK,
          'Sucursales listadas correctamente',
          'auth/sucursal',
        );
      }

      const [data, total] = await this.sucursalRepository.findAndCount({
        where: busqueda ? { nombre: Like(`%${busqueda}%`) } : {},
        skip: (page - 1) * limit,
        take: limit,
        order: { nombre: 'ASC' },
      });

      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Sucursales listadas correctamente',
        'auth/sucursal',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-51', 'Error al listar sucursales');
    }
  }

  // AUT-52
  async findOne(id: string) {
    try {
      const sucursal = await this.sucursalRepository.findOneBy({ id });
      if (!sucursal) {
        return this.customThrowError(
          null,
          'AUT-52-01',
          `Sucursal con ID ${id} no encontrada`,
        );
      }
      return this.customSuccessResponse(
        sucursal,
        null,
        HttpStatus.OK,
        'Sucursal encontrada',
        'auth/sucursal',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-52', 'Error al buscar sucursal');
    }
  }

  // AUT-53
  async update(id: string, updateDto: UpdateSucursalDto) {
    try {
      const sucursal = await this.sucursalRepository.findOneBy({ id });
      if (!sucursal) {
        return this.customThrowError(
          null,
          'AUT-53-01',
          `Sucursal con ID ${id} no encontrada`,
        );
      }
      if (updateDto.municipio) updateDto.municipio = updateDto.municipio.toUpperCase();
      if (updateDto.departamento) updateDto.departamento = updateDto.departamento.toUpperCase();
      await this.sucursalRepository.update(id, updateDto);
      const updated = await this.sucursalRepository.findOneBy({ id });
      return this.customSuccessResponse(
        updated,
        null,
        HttpStatus.OK,
        'Sucursal actualizada correctamente',
        'auth/sucursal',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-53', 'Error al actualizar sucursal');
    }
  }

  // AUT-54
  async remove(id: string) {
    try {
      const sucursal = await this.sucursalRepository.findOneBy({ id });
      if (!sucursal) {
        return this.customThrowError(
          null,
          'AUT-54-01',
          `Sucursal con ID ${id} no encontrada`,
        );
      }
      await this.sucursalRepository.delete(id);
      return this.customSuccessResponse(
        null,
        null,
        HttpStatus.OK,
        'Sucursal eliminada exitosamente',
        'auth/sucursal',
      );
    } catch (error) {
      this.customThrowError(error, 'AUT-54', 'Error al eliminar sucursal');
    }
  }
}
