// ldap.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client } from 'ldapts';

@Injectable()
export class LdapService {
  private url = process.env.LDAP_URL!;
  private baseDN = process.env.LDAP_BASE_DN!;
  private adminUser = process.env.LDAP_USERNAME!;
  private adminPass = process.env.LDAP_PASSWORD!;

  async validateAndGetUser(usernameOrEmail: string, pass: string): Promise<any> {
    const client = new Client({ url: this.url, timeout: 5000, connectTimeout: 5000 });

    try {
      // 1. Conexión inicial con cuenta de servicio para buscar el DN del usuario
      await client.bind(this.adminUser, this.adminPass);

      // Buscamos al usuario por su sAMAccountName o correo (ajusta el filtro según tu AD)
      const searchResult = await client.search(this.baseDN, {
        filter: `(&(objectClass=user)(sAMAccountName=${usernameOrEmail}))`,
        scope: 'sub',
      });

      if (searchResult.searchEntries.length === 0) {
        throw new UnauthorizedException('El usuario no existe en Active Directory');
      }

      const userEntry = searchResult.searchEntries[0];
      const userDN = userEntry.dn; // El Distinguished Name exacto del usuario

      await client.unbind(); // Cerramos sesión de admin

      // 2. Intentar autenticar (bind) con las credenciales que ingresó el usuario final
      const userClient = new Client({ url: this.url, timeout: 5000, connectTimeout: 5000 });
      await userClient.bind(userDN, pass);
      await userClient.unbind();

      // 3. Retornar la información mapeada desde el Active Directory
      return {
        username: userEntry.sAMAccountName,
        email: userEntry.mail || `${userEntry.sAMAccountName}@fundeagt.local`,
        firstName: userEntry.givenName || '',
        lastName: userEntry.sn || '',
      };
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas o error de conexión con Active Directory');
    }
  }
}