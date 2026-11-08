package com.csit321g1.ana.aura.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum WorkStatus implements LabeledEnum {
    PENDING("Pending"),
    SUBMITTED("Submitted"),
    UNDER_REVIEW("Under Review"),
    FOR_REVISION("For Revision"),
    RESUBMITTED("Resubmitted"),
    APPROVED("Approved");

    private final String label;

    WorkStatus(String label) {
        this.label = label;
    }

    @Override
    @JsonValue
    public String getLabel() {
        return label;
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static WorkStatus from(String value) {
        return EnumLookup.parse(WorkStatus.class, value);
    }
}
