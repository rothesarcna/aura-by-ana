package com.csit321g1.ana.aura.service;

import com.csit321g1.ana.aura.dto.ProjectDtos.MemberRequest;
import com.csit321g1.ana.aura.dto.ProjectDtos.MemberResponse;
import com.csit321g1.ana.aura.exception.BadRequestException;
import com.csit321g1.ana.aura.model.HistoryType;
import com.csit321g1.ana.aura.model.ProjectMember;
import com.csit321g1.ana.aura.model.RevisionTask;
import com.csit321g1.ana.aura.model.TaskStatus;
import com.csit321g1.ana.aura.model.User;
import com.csit321g1.ana.aura.repository.ProjectMemberRepository;
import com.csit321g1.ana.aura.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/** Group collaboration: who is in the project's group. */
@Service
@Transactional
public class MemberService {

    private final ProjectMemberRepository members;
    private final UserRepository users;
    private final AccessService access;
    private final SnapshotService snapshots;
    private final HistoryService history;

    public MemberService(ProjectMemberRepository members,
                         UserRepository users,
                         AccessService access,
                         SnapshotService snapshots,
                         HistoryService history) {
        this.members = members;
        this.users = users;
        this.access = access;
        this.snapshots = snapshots;
        this.history = history;
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> list(Long userId, Long projectId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectSnapshot snap = snapshots.load(ctx.project());
        return snap.activeMembers().stream().map(snap::toMember).collect(Collectors.toList());
    }

    /**
     * Adds a member. If the email belongs to a registered account the member is linked to it, which
     * gives that person access to the project. Otherwise the member is just a name tasks can be assigned to.
     */
    public MemberResponse add(Long userId, Long projectId, MemberRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);

        String email = Text.clean(req.email());
        String name = Text.clean(req.name());
        User linked = email == null ? null : users.findByEmailIgnoreCase(email).orElse(null);

        if (linked != null && members.existsByProjectIdAndUserIdAndActiveTrue(projectId, linked.getId())) {
            throw new BadRequestException(linked.getFullName() + " is already a member of this project.");
        }
        if (name == null && linked != null) {
            name = linked.getFullName();
        }
        if (name == null) {
            throw new BadRequestException("A member needs a name, or the email of a registered account.");
        }

        ProjectMember m = new ProjectMember();
        m.setProject(ctx.project());
        m.setUser(linked);
        m.setName(name);
        m.setEmail(linked != null ? linked.getEmail() : email);
        m.setRole(Text.clean(req.role()) == null ? "Member" : Text.clean(req.role()));
        m = members.save(m);

        history.entry(ctx.project(), ctx.user(), HistoryType.MEMBER, "Added group member " + name).save();
        return snapshots.load(ctx.project()).toMember(m);
    }

    public MemberResponse update(Long userId, Long projectId, Long memberId, MemberRequest req) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectMember m = access.member(projectId, memberId);

        if (Text.clean(req.name()) != null) {
            m.setName(Text.clean(req.name()));
        }
        if (Text.clean(req.role()) != null) {
            m.setRole(Text.clean(req.role()));
        }
        if (m.getUser() == null && req.email() != null) {
            m.setEmail(Text.clean(req.email()));
        }
        members.save(m);

        history.entry(ctx.project(), ctx.user(), HistoryType.MEMBER, "Updated group member " + m.getName()).save();
        return snapshots.load(ctx.project()).toMember(m);
    }

    /** Removes a member from the group. The row is kept (inactive) so old tasks and history still show their name. */
    public void remove(Long userId, Long projectId, Long memberId) {
        AccessService.ProjectAccess ctx = access.require(projectId, userId);
        ProjectMember m = access.member(projectId, memberId);
        ProjectSnapshot snap = snapshots.load(ctx.project());

        List<RevisionTask> open = snap.tasks().stream()
                .filter(t -> t.getAssignee_id() != null && t.getAssignee_id().getId().equals(m.getId()))
                .filter(t -> t.getStatus() != TaskStatus.DONE)
                .collect(Collectors.toList());
        if (!open.isEmpty()) {
            throw new BadRequestException(m.getName() + " still has " + open.size()
                    + " unfinished task(s). Reassign them first.");
        }

        long accountMembers = snap.activeMembers().stream().filter(x -> x.getUser() != null).count();
        if (m.getUser() != null && accountMembers <= 1) {
            throw new BadRequestException("The last member with an account cannot be removed.");
        }

        m.setActive(false);
        members.save(m);
        history.entry(ctx.project(), ctx.user(), HistoryType.MEMBER, "Removed group member " + m.getName()).save();
    }
}
