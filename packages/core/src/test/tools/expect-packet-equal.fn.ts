import { EntityStreamPacket } from "../../lib/execution/entity-stream-packet";

export function expectPacketEqual(actual: EntityStreamPacket, expected: EntityStreamPacket): void {
    expect(actual.getErrors().map(error => error.getErrorMessage())).toEqual(
        expected.getErrors().map(error => error.getErrorMessage())
    );

    expect(actual.getAcceptedQueries().map(query => query.toString())).toEqual(
        expected.getAcceptedQueries().map(query => query.toString())
    );

    expect(actual.getDeliveredQueries().map(query => query.toString())).toEqual(
        expected.getDeliveredQueries().map(query => query.toString())
    );

    expect(actual.getRejectedQueries().map(query => query.toString())).toEqual(
        expected.getRejectedQueries().map(query => query.toString())
    );

    expect(actual.getPayload().map(payload => payload.getQuery().toString())).toEqual(
        expected.getPayload().map(payload => payload.getQuery().toString())
    );

    expect(actual.getPayload().map(payload => payload.getEntities())).toEqual(
        expected.getPayload().map(payload => payload.getEntities())
    );
}
