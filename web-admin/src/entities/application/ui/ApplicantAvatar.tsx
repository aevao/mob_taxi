import { initials } from "@/shared/lib";
import { Avatar } from "@/shared/ui";
import { useApplicationDocument } from "../api/applicationApi";
import type { DriverApplication } from "../model/types";

interface ApplicantAvatarProps {
  application: DriverApplication;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ApplicantAvatar({ application, size = "md" }: ApplicantAvatarProps) {
  const photo = useApplicationDocument(application, "profilePhoto");
  return (
    <Avatar
      src={photo.data}
      size={size}
      fallback={initials(application.firstName, application.lastName)}
    />
  );
}
