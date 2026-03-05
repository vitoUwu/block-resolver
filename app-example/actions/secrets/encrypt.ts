import { encryptToHex } from "../../utils/crypto";

interface Props {
  value: string;
}

interface SignedMessage {
  value: string;
}

export default async function encryptAction(
  props: Props,
): Promise<SignedMessage> {
  return {
    value: await encryptToHex(props.value),
  };
}
