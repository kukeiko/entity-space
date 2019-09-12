import { DomainBuilder } from "@sandbox";
import { UserType, SystemType, UserTypeType } from "../types";

let domainBuilder = new DomainBuilder();

let domain = domainBuilder
    .define(SystemType.getDefinition())
    .define(UserType.getDefinition())
    .define(UserTypeType.getDefinition())
    .build();
