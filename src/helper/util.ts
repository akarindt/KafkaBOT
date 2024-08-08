export class Utils {
    public static GetUrlPath = (url: string): string => {
        return url.replace(/^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/, "")
    }
}


