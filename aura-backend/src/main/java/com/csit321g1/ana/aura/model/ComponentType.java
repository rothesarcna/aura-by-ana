package com.csit321g1.ana.aura.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ComponentType implements LabeledEnum {
    CHAPTER("Chapter"),
    PROPOSAL("Proposal"),
    DOCUMENTATION("Documentation"),
    PROTOTYPE("Prototype"),
    PRESENTATION("Presentation"),
    OTHER("Other");

    private final String label;

    ComponentType(String label) {
        this.label = label;
    }

    @Override
    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static ComponentType from(String value) {
        return EnumLookup.parse(ComponentType.class, value);
    }
}
