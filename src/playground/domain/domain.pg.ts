import { Domain, DomainBuilder } from "@sandbox";
import { UserType, SystemType } from "../types";

type Defined = UserType | SystemType;

let domainBuilder = new DomainBuilder();

let domain = domainBuilder
    .define(SystemType.getDefinition())
    .define(UserType.getDefinition())
    .build();
