export interface Reference {
    locality: "navigation";
    type: "reference";
    dtoName?: string;
    keyName: string;
    name: string;
    target: string;
    virtual: boolean;
}
