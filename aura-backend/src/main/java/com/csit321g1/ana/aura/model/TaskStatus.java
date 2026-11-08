package com.csit321g1.ana.aura.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TaskStatus implements LabeledEnum {
    TO_DO("To Do"),
    IN_PROGRESS("In Progress"),
    NEEDS_CLARIFICATION("Needs Clarification"),
    DONE("Done");

    private final String label;

    TaskStatus(String label) {
        this.label = label;
    }

    @Override
    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static TaskStatus from(String value) {
        return EnumLookup.parse(TaskStatus.class, value);
    }
}
