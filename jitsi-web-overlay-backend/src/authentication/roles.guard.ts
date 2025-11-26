import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new ForbiddenException('Utilisateur non authentifié');
        }
        // admin bool ou string ou array de roles
        if (requiredRoles.includes('admin')) {
            if (user.admin === true || user.admin === 'true') {
                return true;
            }
            if (Array.isArray(user.roles) && user.roles.includes('admin')) {
                return true;
            }
            throw new ForbiddenException('Accès réservé aux administrateurs');
        }
        // Autres rôles
        if (Array.isArray(user.roles)) {
            return requiredRoles.some(role => user.roles.includes(role));
        }
        if (typeof user.role === 'string') {
            return requiredRoles.includes(user.role);
        }
        throw new ForbiddenException('Accès refusé');
    }
}
