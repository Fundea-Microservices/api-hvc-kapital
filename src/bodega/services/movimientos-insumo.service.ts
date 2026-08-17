import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MovimientoInsumo } from 'database/entities/bodega/movimiento-insumo.entity';
import { Insumo } from 'database/entities/bodega/insumo.entity';
import { BaseService } from 'src/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateMovimientoInsumoDto } from '../dto/movimiento-insumo.dto';

@Injectable()
export class MovimientosInsumoService extends BaseService {
  constructor(
    @Inject('MOVIMIENTO_INSUMO_REPOSITORY')
    private readonly movimientoRepository: Repository<MovimientoInsumo>,
    @Inject('INSUMO_REPOSITORY')
    private readonly insumoRepository: Repository<Insumo>,
  ) {
    super();
  }

  protected readonly logger = new Logger('MovimientosInsumoService');

  async create(createDto: CreateMovimientoInsumoDto, usuarioId?: string) {
    try {
      const insumo = await this.insumoRepository.findOneBy({ id: createDto.insumo_id });
      if (!insumo) {
        return this.customThrowError(null, 'BOD-30-01', 'Insumo no encontrado');
      }

      // Actualizar inventario
      if (createDto.tipo_movimiento === 'ENTRADA') {
        insumo.cantidad_actual = Number(insumo.cantidad_actual) + Number(createDto.cantidad);
      } else if (createDto.tipo_movimiento === 'SALIDA') {
        if (Number(insumo.cantidad_actual) < Number(createDto.cantidad)) {
          return this.customThrowError(null, 'BOD-30-02', 'Stock insuficiente para esta salida');
        }
        insumo.cantidad_actual = Number(insumo.cantidad_actual) - Number(createDto.cantidad);
      } else if (createDto.tipo_movimiento === 'AJUSTE') {
        insumo.cantidad_actual = Number(createDto.cantidad);
      }

      await this.insumoRepository.save(insumo);

      const movimiento = this.movimientoRepository.create({
        ...createDto,
        usuario_id: usuarioId,
      });
      const saved = await this.movimientoRepository.save(movimiento);

      // Determinar estado de alerta del insumo tras el movimiento
      let alerta: 0 | 1 | 2 | 3;
      if (insumo.cantidad_actual <= insumo.punto_minimo) {
        alerta = 1; // Alerta Roja
      } else if (insumo.cantidad_actual <= insumo.punto_medio) {
        alerta = 2; // Alerta Amarilla
      } else {
        alerta = 3; // Sin alerta
      }

      const alertaMensaje: Record<1 | 2 | 3, string> = {
        1: `Alerta Roja: el stock de "${insumo.nombre}" está en o por debajo del punto mínimo (${insumo.cantidad_actual} ${insumo.unidad})`,
        2: `Alerta Amarilla: el stock de "${insumo.nombre}" está por debajo del punto medio (${insumo.cantidad_actual} ${insumo.unidad})`,
        3: `Stock de "${insumo.nombre}" en niveles normales (${insumo.cantidad_actual} ${insumo.unidad})`,
      };

      return this.customSuccessResponse(
        { movimiento: saved, insumo_actualizado: insumo },
        { alerta, alerta_mensaje: alertaMensaje[alerta] },
        HttpStatus.CREATED,
        'Movimiento de insumo registrado exitosamente',
        'bodega/movimientos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-30', 'Error al registrar movimiento de insumo');
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.movimientoRepository.findAndCount({
        relations: ['insumo'],
        skip: (page - 1) * limit,
        take: limit,
        order: { fecha_movimiento: 'DESC' },
      });
      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        'Movimientos de insumo listados correctamente',
        'bodega/movimientos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-31', 'Error al listar movimientos de insumo');
    }
  }

  async findByInsumo(insumoId: string, paginationDto: PaginationDto) {
    try {
      const { page, limit } = paginationDto;
      const [data, total] = await this.movimientoRepository.findAndCount({
        where: { insumo_id: insumoId },
        relations: ['insumo'],
        skip: (page - 1) * limit,
        take: limit,
        order: { fecha_movimiento: 'DESC' },
      });
      return this.customSuccessResponse(
        data,
        { total, page, limit },
        HttpStatus.OK,
        `Movimientos para el insumo ${insumoId} listados`,
        'bodega/movimientos',
      );
    } catch (error) {
      this.customThrowError(error, 'BOD-32', 'Error al buscar movimientos de insumo por insumo');
    }
  }
}
