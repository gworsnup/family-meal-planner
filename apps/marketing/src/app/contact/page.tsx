import Contactus from "@/components/contact-us";
import { contactContent } from "@/content/contact";

export default async function ContactPage() {
  return <Contactus content={contactContent} />;
}
