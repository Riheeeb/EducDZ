type SessionPayload = {
  token: string;
  tokenType?: string;
  userId: number;
  email: string;
  name: string;
  accountType: string;
  teacher?: {
    subject?: string;
  };
  student?: {
    studentLevel?: string;
    year?: string;
    stream?: string;
    substream?: string;
    isTechMath?: boolean;
  };
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const saveSession = (payload: SessionPayload) => {
  localStorage.setItem(TOKEN_KEY, payload.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
        userId: payload.userId,
      email: payload.email,
      name: payload.name,
      accountType: payload.accountType,
      teacher: payload.teacher ?? null,
      student: payload.student ?? null,
    })
  );
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
