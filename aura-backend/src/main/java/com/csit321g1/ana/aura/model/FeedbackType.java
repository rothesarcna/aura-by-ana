package com.csit321g1.ana.aura.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum FeedbackType implements LabeledEnum {
    FEEDBACK("Feedback"),
    CLARIFICATION("Clarification");

    private final String label;

    FeedbackType(String label) {
        this.label = label;
    }

    @Override
    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static FeedbackType from(String value) {
        return EnumLookup.parse(FeedbackType.class, value);
    }
}
