import type { Response } from "express";
import { Code } from "../../core/enums/code.enum";
import { Status } from "../../core/enums/status.enum";

class HttpResponse<T> {
	public readonly message: Status;
	public readonly success: boolean;
	public readonly data?: T;

	constructor(code: Code, message: Status, data?: T) {
		this.success = code >= 200 && code < 300;
		this.message = message;
		this.data = data;
	}

	static success<T>(data?: T): HttpResponse<T> {
		return new HttpResponse(Code.OK, Status.OK, data);
	}

	static created<T>(data?: T): HttpResponse<T> {
		return new HttpResponse(Code.CREATED, Status.CREATED, data);
	}

	static accepted<T>(data?: T): HttpResponse<T> {
		return new HttpResponse(Code.ACCEPTED, Status.ACCEPTED, data);
	}

	static noContent(): HttpResponse<void> {
		return new HttpResponse(Code.NO_CONTENT, Status.NO_CONTENT);
	}

	static badRequest(): HttpResponse<void> {
		return new HttpResponse(Code.BAD_REQUEST, Status.BAD_REQUEST);
	}

	static unauthorized(): HttpResponse<void> {
		return new HttpResponse(Code.UNAUTHORIZED, Status.UNAUTHORIZED);
	}

	static forbidden(): HttpResponse<void> {
		return new HttpResponse(Code.FORBIDDEN, Status.FORBIDDEN);
	}

	static notFound(): HttpResponse<void> {
		return new HttpResponse(Code.NOT_FOUND, Status.NOT_FOUND);
	}

	static methodNotAllowed(): HttpResponse<void> {
		return new HttpResponse(Code.METHOD_NOT_ALLOWED, Status.METHOD_NOT_ALLOWED);
	}

	static conflict(): HttpResponse<void> {
		return new HttpResponse(Code.CONFLICT, Status.CONFLICT);
	}

	static internalServerError(): HttpResponse<void> {
		return new HttpResponse(
			Code.INTERNAL_SERVER_ERROR,
			Status.INTERNAL_SERVER_ERROR,
		);
	}

	static notImplemented(): HttpResponse<void> {
		return new HttpResponse(Code.NOT_IMPLEMENTED, Status.NOT_IMPLEMENTED);
	}

	static badGateway(): HttpResponse<void> {
		return new HttpResponse(Code.BAD_GATEWAY, Status.BAD_GATEWAY);
	}

	static serviceUnavailable(): HttpResponse<void> {
		return new HttpResponse(
			Code.SERVICE_UNAVAILABLE,
			Status.SERVICE_UNAVAILABLE,
		);
	}
}

export const responseHelper = {
	ok: <T>(res: Response, data?: T) =>
		res.status(Code.OK).send(HttpResponse.success(data)),

	created: <T>(res: Response, data?: T) =>
		res.status(Code.CREATED).send(HttpResponse.created(data)),

	accepted: <T>(res: Response, data?: T) =>
		res.status(Code.ACCEPTED).send(HttpResponse.accepted(data)),

	noContent: (res: Response) =>
		res.status(Code.NO_CONTENT).send(HttpResponse.noContent()),

	badRequest: (res: Response) =>
		res.status(Code.BAD_REQUEST).send(HttpResponse.badRequest()),

	unauthorized: (res: Response) =>
		res.status(Code.UNAUTHORIZED).send(HttpResponse.unauthorized()),

	forbidden: (res: Response) =>
		res.status(Code.FORBIDDEN).send(HttpResponse.forbidden()),

	notFound: (res: Response) =>
		res.status(Code.NOT_FOUND).send(HttpResponse.notFound()),

	methodNotAllowed: (res: Response) =>
		res.status(Code.METHOD_NOT_ALLOWED).send(HttpResponse.methodNotAllowed()),

	conflict: (res: Response) =>
		res.status(Code.CONFLICT).send(HttpResponse.conflict()),

	internalServerError: (res: Response) =>
		res
			.status(Code.INTERNAL_SERVER_ERROR)
			.send(HttpResponse.internalServerError()),

	notImplemented: (res: Response) =>
		res.status(Code.NOT_IMPLEMENTED).send(HttpResponse.notImplemented()),

	badGateway: (res: Response) =>
		res.status(Code.BAD_GATEWAY).send(HttpResponse.badGateway()),

	serviceUnavailable: (res: Response) =>
		res
			.status(Code.SERVICE_UNAVAILABLE)
			.send(HttpResponse.serviceUnavailable()),
};
