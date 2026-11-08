package com.csit321g1.ana.aura.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum FeedbackStatus implements LabeledEnum {
    OPEN("Open"),
    RESOLVED("Resolved"),
    SUPERSEDED("Superseded");

    private final String label;

    FeedbackStatus(String label) {
        this.label = label;
    }

    @Override
    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static FeedbackStatus from(String value) {
        return EnumLookup.parse(FeedbackStatus.class, value);
    }
}
