package com.csit321g1.ana.aura.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum HistoryType implements LabeledEnum {
    PROJECT("Project"),
    COMPONENT("Component"),
    STATUS_CHANGE("Status Change"),
    FEEDBACK("Feedback"),
    TASK("Task"),
    REVISION("Revision"),
    MEMBER("Member");

    private final String label;

    HistoryType(String label) {
        this.label = label;
    }

    @Override
    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static HistoryType from(String value) {
        return EnumLookup.parse(HistoryType.class, value);
    }
}
